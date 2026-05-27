import { readAuthSession, saveAuthSession, type UserProfile } from '@/lib/user-api';
import { syncProfileToLegacyStorage } from '@/lib/user-mappers';

export const PROFILE_PHOTO_STORAGE_KEY = 'dcspaceProfilePhotoImage';
export const PROFILE_COVER_STORAGE_KEY = 'dcspaceProfileCoverImage';

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.82;
const MAX_DATA_URL_LENGTH = 280_000;

export function getProfilePhotoFromSession() {
  return readAuthSession()?.user.photoUrl?.trim() || '';
}

export function safeSetLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      window.localStorage.removeItem(key);
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function compressDataUrl(dataUrl: string, maxDimension = MAX_DIMENSION) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Unable to process image.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve(compressed.length <= MAX_DATA_URL_LENGTH ? compressed : canvas.toDataURL('image/jpeg', 0.65));
    };

    image.onerror = () => reject(new Error('Unable to read image.'));
    image.src = dataUrl;
  });
}

export async function fileToCompressedDataUrl(file: File, maxDimension = MAX_DIMENSION) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read image file.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });

  return compressDataUrl(dataUrl, maxDimension);
}

export async function prepareProfilePhotoForStorage(file: File) {
  return fileToCompressedDataUrl(file, MAX_DIMENSION);
}

export async function prepareCoverImageForStorage(file: File) {
  return fileToCompressedDataUrl(file, 960);
}

export function applyProfilePhotoLocally(photoUrl: string, fit?: { zoom: number; x: number; y: number }) {
  safeSetLocalStorage(PROFILE_PHOTO_STORAGE_KEY, photoUrl);
  if (fit) {
    safeSetLocalStorage('dcspaceProfilePhotoFit', JSON.stringify(fit));
  }

  const session = readAuthSession();
  if (session) {
    const updatedUser: UserProfile = { ...session.user, photoUrl };
    saveAuthSession(session.token, updatedUser);
    syncProfileToLegacyStorage(updatedUser);
  }
}

export function pruneOversizedProfileStorage() {
  if (typeof window === 'undefined') return;

  const photo = window.localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
  if (photo && photo.length > MAX_DATA_URL_LENGTH) {
    window.localStorage.removeItem(PROFILE_PHOTO_STORAGE_KEY);
  }

  const cover = window.localStorage.getItem(PROFILE_COVER_STORAGE_KEY);
  if (cover && cover.length > MAX_DATA_URL_LENGTH * 2) {
    window.localStorage.removeItem(PROFILE_COVER_STORAGE_KEY);
  }
}
