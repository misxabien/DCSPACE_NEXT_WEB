'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
<<<<<<< HEAD
import type { FrontendEvent } from '@/lib/dc-events';
=======
import { canOrganizeEvents, readOrganizedEvents } from '@/lib/dc-events';
>>>>>>> origin/frontend-user
import {
  getCertificateStatus,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  getRequirementStatus,
<<<<<<< HEAD
  type AttendanceRecord,
  type RegisteredEvent,
} from '@/lib/attendance';
import {
  getProfilePhotoFromSession,
  getProfileCoverFitStorageKey,
  getProfileCoverStorageKey,
  getProfilePhotoFitStorageKey,
  getProfilePhotoStorageKey,
  prepareCoverImageForStorage,
  prepareProfilePhotoForStorage,
  pruneOversizedProfileStorage,
  safeSetLocalStorage,
} from '@/lib/profile-images';
import {
  loadAttendanceRecords,
  loadOrganizedEventsForUser,
  loadRegisteredEvents,
  refreshProfile,
  saveProfilePhoto,
  userCanOrganize,
} from '@/lib/user-data';
import { readAuthSession } from '@/lib/user-api';
=======
  readRegisteredEvents,
  readUserAttendanceRecords,
} from '@/lib/attendance';
>>>>>>> origin/frontend-user

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

type ProfileImageFit = {
  zoom: number;
  x: number;
  y: number;
};

function getDisplayValue(value?: string) {
  return value && value !== 'Not provided' ? value : 'Not available';
}

function getInitials(firstName?: string, lastName?: string, fallback?: string) {
  const firstInitial = firstName?.trim().charAt(0) || '';
  const lastInitial = lastName?.trim().charAt(0) || '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || fallback?.trim().slice(0, 2).toUpperCase() || 'DC';
}

function readImageFit(storageKey: string): ProfileImageFit {
  if (typeof window === 'undefined') return { zoom: 1, x: 0, y: 0 };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as Partial<ProfileImageFit>;

    return {
      zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 1,
      x: typeof parsed.x === 'number' ? parsed.x : 0,
      y: typeof parsed.y === 'number' ? parsed.y : 0,
    };
  } catch {
    return { zoom: 1, x: 0, y: 0 };
  }
}

function profileImageStyle(fit: ProfileImageFit): CSSProperties {
  return {
    transform: `translate(${fit.x}%, ${fit.y}%) scale(${fit.zoom})`,
  };
}

function dispatchProfileUpdate() {
  window.dispatchEvent(new CustomEvent('dcspace-profile-updated'));
}

<<<<<<< HEAD
function getEventName(event: RegisteredEvent) {
  return event.name || 'Event';
=======
function getEventName(event: ReturnType<typeof readRegisteredEvents>[number]) {
  return event.name || 'Event Name';
>>>>>>> origin/frontend-user
}

function isFacultyUser(user: ReturnType<typeof getCurrentAttendanceUser> | null) {
  const savedAccountType = typeof window === 'undefined' ? '' : window.localStorage.getItem('dcspaceAccountType');
  const values = [savedAccountType, user?.organizationRole, user?.organizationPart, user?.school, user?.studentEmail];

  return values.some((value) => value?.toLowerCase().includes('faculty'));
}
<<<<<<< HEAD

function resolveProfileUser() {
  const attendanceUser = getCurrentAttendanceUser();
  const sessionUser = readAuthSession()?.user;

  if (!sessionUser) {
    return attendanceUser;
  }

  return {
    ...attendanceUser,
    firstName: attendanceUser.firstName || sessionUser.firstName || '',
    lastName: attendanceUser.lastName || sessionUser.lastName || '',
    studentEmail: attendanceUser.studentEmail || sessionUser.email || '',
    studentNumber: attendanceUser.studentNumber || sessionUser.studentNumber || '',
    rfidNumber: attendanceUser.rfidNumber || sessionUser.rfidNumber || '',
    course: attendanceUser.course || sessionUser.course || '',
    school: attendanceUser.school || sessionUser.school || '',
    organizationPart: attendanceUser.organizationPart || sessionUser.organizationPart || '',
    organizationRole: attendanceUser.organizationRole || sessionUser.organizationRole || '',
  };
}

export function MyProfileContent() {
  const [user, setUser] = useState<ReturnType<typeof getCurrentAttendanceUser> | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<FrontendEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
=======

export function MyProfileContent() {
  const [user, setUser] = useState<ReturnType<typeof getCurrentAttendanceUser> | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<ReturnType<typeof readRegisteredEvents>>([]);
  const [organizedEvents, setOrganizedEvents] = useState<ReturnType<typeof readOrganizedEvents>>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, ReturnType<typeof readUserAttendanceRecords>[string]>>({});
>>>>>>> origin/frontend-user
  const [canViewOrganizedEvents, setCanViewOrganizedEvents] = useState(false);
  const [profilePhotoImage, setProfilePhotoImage] = useState('');
  const [profilePhotoFit, setProfilePhotoFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
  const [profileCoverImage, setProfileCoverImage] = useState('');
  const [profileCoverFit, setProfileCoverFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
  const [draftPhotoImage, setDraftPhotoImage] = useState('');
  const [draftPhotoFit, setDraftPhotoFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
  const [draftCoverImage, setDraftCoverImage] = useState('');
  const [draftCoverFit, setDraftCoverFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
<<<<<<< HEAD
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoNotice, setPhotoNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    const refreshProfileData = async () => {
      pruneOversizedProfileStorage();
      await refreshProfile();
      const currentUser = resolveProfileUser();
      const canOrganize = userCanOrganize();
      const canViewOrganizedStatistics = canOrganize || isFacultyUser(currentUser);

      const [registered, attendance, organized] = await Promise.all([
        loadRegisteredEvents(),
        loadAttendanceRecords(),
        canViewOrganizedStatistics ? loadOrganizedEventsForUser() : Promise.resolve([]),
      ]);

      if (cancelled) return;

      setUser(currentUser);
      setRegisteredEvents(registered);
      setAttendanceRecords(attendance);
      setCanViewOrganizedEvents(canViewOrganizedStatistics);
      setOrganizedEvents(organized);
      const sessionPhoto = getProfilePhotoFromSession();
      const cachedPhoto =
        typeof window !== 'undefined' ? window.localStorage.getItem(getProfilePhotoStorageKey()) || '' : '';
      setProfilePhotoImage(sessionPhoto || cachedPhoto);
      setProfilePhotoFit(readImageFit(getProfilePhotoFitStorageKey()));
      setProfileCoverImage(
        typeof window !== 'undefined' ? window.localStorage.getItem(getProfileCoverStorageKey()) || '' : '',
      );
      setProfileCoverFit(readImageFit(getProfileCoverFitStorageKey()));
    };

    void refreshProfileData();
    window.addEventListener('pageshow', () => void refreshProfileData());
    window.addEventListener('storage', () => void refreshProfileData());
    window.addEventListener('dcspace-events-updated', () => void refreshProfileData());
    window.addEventListener('dcspace-registered-events-updated', () => void refreshProfileData());
    window.addEventListener('dcspace-profile-updated', () => void refreshProfileData());

    return () => {
      cancelled = true;
=======

  useEffect(() => {
    const refreshProfile = () => {
      const currentUser = getCurrentAttendanceUser();
      const canOrganize = canOrganizeEvents();
      const canViewOrganizedStatistics = canOrganize || isFacultyUser(currentUser);

      setUser(currentUser);
      setRegisteredEvents(readRegisteredEvents());
      setAttendanceRecords(readUserAttendanceRecords(currentUser));
      setCanViewOrganizedEvents(canViewOrganizedStatistics);
      setOrganizedEvents(canViewOrganizedStatistics ? readOrganizedEvents() : []);
      setProfilePhotoImage(window.localStorage.getItem('dcspaceProfilePhotoImage') || '');
      setProfilePhotoFit(readImageFit('dcspaceProfilePhotoFit'));
      setProfileCoverImage(window.localStorage.getItem('dcspaceProfileCoverImage') || '');
      setProfileCoverFit(readImageFit('dcspaceProfileCoverFit'));
    };

    refreshProfile();
    window.addEventListener('pageshow', refreshProfile);
    window.addEventListener('storage', refreshProfile);
    window.addEventListener('dcspace-events-updated', refreshProfile);
    window.addEventListener('dcspace-registered-events-updated', refreshProfile);
    window.addEventListener('dcspace-profile-updated', refreshProfile);

    return () => {
      window.removeEventListener('pageshow', refreshProfile);
      window.removeEventListener('storage', refreshProfile);
      window.removeEventListener('dcspace-events-updated', refreshProfile);
      window.removeEventListener('dcspace-registered-events-updated', refreshProfile);
      window.removeEventListener('dcspace-profile-updated', refreshProfile);
>>>>>>> origin/frontend-user
    };
  }, []);

  const attendedEvents = useMemo(() => {
    return registeredEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      return attendanceRecords[eventId];
    });
  }, [attendanceRecords, registeredEvents]);

  const certificateEvents = useMemo(() => {
    return attendedEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      const record = attendanceRecords[eventId];
      return getCertificateStatus(record, event) === 'Download';
    });
  }, [attendanceRecords, attendedEvents]);

  const completedEvents = useMemo(() => {
    return registeredEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      const status = getRequirementStatus(attendanceRecords[eventId], event);

      return status === 'Complete' || status === 'Overtime';
    });
  }, [attendanceRecords, registeredEvents]);

  const recentActivities = useMemo(() => {
    const activities = [
      ...attendedEvents.slice(-2).map((event) => `Joined ${getEventName(event)}`),
      ...certificateEvents.slice(-1).map((event) => `Received certificate for ${getEventName(event)}`),
    ];

    return activities.length ? activities.slice(-4).reverse() : ['No recent activity yet'];
  }, [attendedEvents, certificateEvents]);

  const fullName = `${getDisplayValue(user?.firstName)} ${getDisplayValue(user?.lastName)}`.replace(/Not available/g, '').trim() || 'User Name';
  const initials = getInitials(user?.firstName, user?.lastName, user?.studentEmail);
  const hasOrganizedStatisticsAccess = canViewOrganizedEvents || isFacultyUser(user);

<<<<<<< HEAD
  const saveProfilePhotoHandler = () => {
    if (!draftPhotoImage || isSavingPhoto) return;

    const nextPhoto = draftPhotoImage;
    setIsSavingPhoto(true);
    setPhotoError('');
    setPhotoNotice('');

    void saveProfilePhoto(nextPhoto, draftPhotoFit)
      .then((result) => {
        setProfilePhotoImage(nextPhoto);
        setProfilePhotoFit(draftPhotoFit);
        setDraftPhotoImage('');
        dispatchProfileUpdate();
        if (result && typeof result === 'object' && 'notice' in result && result.notice) {
          setPhotoNotice(String(result.notice));
        }
      })
      .catch((error) => {
        setPhotoError(error instanceof Error ? error.message : 'Failed to save profile photo.');
      })
      .finally(() => {
        setIsSavingPhoto(false);
      });
=======
  const saveProfilePhoto = () => {
    if (!draftPhotoImage) return;

    window.localStorage.setItem('dcspaceProfilePhotoImage', draftPhotoImage);
    window.localStorage.setItem('dcspaceProfilePhotoFit', JSON.stringify(draftPhotoFit));
    setProfilePhotoImage(draftPhotoImage);
    setProfilePhotoFit(draftPhotoFit);
    setDraftPhotoImage('');
    dispatchProfileUpdate();
>>>>>>> origin/frontend-user
  };

  const saveProfileCover = () => {
    if (!draftCoverImage) return;

<<<<<<< HEAD
    safeSetLocalStorage(getProfileCoverStorageKey(), draftCoverImage);
    safeSetLocalStorage(getProfileCoverFitStorageKey(), JSON.stringify(draftCoverFit));
=======
    window.localStorage.setItem('dcspaceProfileCoverImage', draftCoverImage);
    window.localStorage.setItem('dcspaceProfileCoverFit', JSON.stringify(draftCoverFit));
>>>>>>> origin/frontend-user
    setProfileCoverImage(draftCoverImage);
    setProfileCoverFit(draftCoverFit);
    setDraftCoverImage('');
    dispatchProfileUpdate();
  };

  const handleImageUpload = (file: File | undefined, target: 'photo' | 'cover') => {
    if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) return;

<<<<<<< HEAD
    setPhotoError('');
    const prepare = target === 'photo' ? prepareProfilePhotoForStorage : prepareCoverImageForStorage;

    void prepare(file)
      .then((compressed) => {
        const defaultFit = { zoom: 1, x: 0, y: 0 };

        if (target === 'photo') {
          setDraftPhotoImage(compressed);
          setDraftPhotoFit(defaultFit);
        } else {
          setDraftCoverImage(compressed);
          setDraftCoverFit(defaultFit);
        }
      })
      .catch((error) => {
        setPhotoError(error instanceof Error ? error.message : 'Unable to process image.');
      });
=======
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      const defaultFit = { zoom: 1, x: 0, y: 0 };

      if (target === 'photo') {
        setDraftPhotoImage(reader.result);
        setDraftPhotoFit(defaultFit);
      } else {
        setDraftCoverImage(reader.result);
        setDraftCoverFit(defaultFit);
      }
    };
    reader.readAsDataURL(file);
>>>>>>> origin/frontend-user
  };

  const displayedPhotoImage = draftPhotoImage || profilePhotoImage;
  const displayedPhotoFit = draftPhotoImage ? draftPhotoFit : profilePhotoFit;
  const displayedCoverImage = draftCoverImage || profileCoverImage;
  const displayedCoverFit = draftCoverImage ? draftCoverFit : profileCoverFit;

  return (
    <main className="main--profile">
      <section className={`profile-cover${displayedCoverImage ? ' has-cover-image' : ''}`}>
        {displayedCoverImage && (
          <Image className="profile-cover__image" src={displayedCoverImage} alt="" fill unoptimized style={profileImageStyle(displayedCoverFit)} />
        )}
        {draftCoverImage ? (
          <button className="profile-upload profile-upload--cover" type="button" onClick={saveProfileCover}>
            Save
          </button>
        ) : (
          <label className="profile-upload profile-upload--cover">
            Upload Photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              onChange={(event) => handleImageUpload(event.target.files?.[0], 'cover')}
            />
          </label>
        )}

        {draftCoverImage && (
          <ImageAdjustControls className="profile-photo-adjust--cover" fit={draftCoverFit} onChange={setDraftCoverFit} target="cover photo" />
        )}
      </section>

      <div className="profile-layout">
        <section className="profile-card profile-card--identity" aria-label="Profile details">
          <div className="profile-card__top">
            <div className="profile-avatar" aria-hidden="true">
              {displayedPhotoImage ? (
                <Image src={displayedPhotoImage} alt="" width={92} height={92} unoptimized style={profileImageStyle(displayedPhotoFit)} />
              ) : (
                <span>{initials}</span>
              )}
            </div>

<<<<<<< HEAD
            {photoError ? (
              <p className="profile-upload-error" role="alert">
                {photoError}
              </p>
            ) : null}

            {photoNotice ? (
              <p className="profile-upload-notice" role="status">
                {photoNotice}
              </p>
            ) : null}

            {draftPhotoImage ? (
              <button className="profile-upload" type="button" onClick={saveProfilePhotoHandler} disabled={isSavingPhoto}>
                {isSavingPhoto ? 'Saving…' : 'Save'}
=======
            {draftPhotoImage ? (
              <button className="profile-upload" type="button" onClick={saveProfilePhoto}>
                Save
>>>>>>> origin/frontend-user
              </button>
            ) : (
              <label className="profile-upload">
                Upload Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  onChange={(event) => handleImageUpload(event.target.files?.[0], 'photo')}
                />
              </label>
            )}
          </div>
<<<<<<< HEAD

          {draftPhotoImage && <ImageAdjustControls fit={draftPhotoFit} onChange={setDraftPhotoFit} target="profile photo" />}

          <div className="profile-info-box">
            <ProfileField label="Your Name" value={fullName} />
            <ProfileField label="School Email" value={getDisplayValue(user?.studentEmail)} />
            <ProfileField label="Student Number" value={getDisplayValue(user?.studentNumber)} />
          </div>

          <div className="profile-info-box">
            <ProfileField label={`About ${getDisplayValue(user?.firstName)}`} value="" />
            <ProfileField label="Course" value={getDisplayValue(user?.course)} />
            <ProfileField label="School/Department" value={getDisplayValue(user?.school)} />
            <ProfileField label="Organization" value={getDisplayValue(user?.organizationPart)} />
            <ProfileField label="Organization Role" value={getDisplayValue(user?.organizationRole)} />
=======
          <div className="profile-summary__fields">
            <p className="profile-summary__name">{profile?.fullName || "Full Name"}</p>
            <p className="profile-summary__line">
              <span>Student Number:</span> {profile?.studentNumber || "2024-01452"}
            </p>
            <p className="profile-summary__line">
              <span>RFID Tag No.:</span> {profile?.rfidNumber || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Email:</span> {profile?.email || "No email on file"}
            </p>
            <p className="profile-summary__line">
              <span>Course:</span> {profile?.course || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>School:</span> {profile?.school || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Organization/Club:</span> {profile?.organizationPart || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Position:</span> {profile?.organizationRole || "Not provided"}
            </p>
            <p className="profile-summary__line">
              <span>Account Type:</span> {profile?.role ? `${profile.role} account` : "student account"}
            </p>
            {profileError && <p className="auth-field-error">{profileError}</p>}
>>>>>>> backup/backend-user
          </div>
        </section>

        <section className="profile-card profile-card--summary profile-side" aria-label="Account summary">
          <div className="profile-info-box profile-statistics">
            <h2>Account Statistics</h2>
            <ProfileStat label="Events Attended" value={attendedEvents.length} />
            <ProfileStat label="Certificates Earned" value={certificateEvents.length} />
            {hasOrganizedStatisticsAccess ? (
              <ProfileStat label="Events Organized" value={organizedEvents.length} />
            ) : (
              <ProfileStat label="Events Completed" value={completedEvents.length} />
            )}
          </div>

          <div className="profile-info-box profile-activity">
            <h2>Recent Activity</h2>
            <ul>
              {recentActivities.map((activity) => (
                <li key={activity}>
                  <span aria-hidden="true" />
                  {activity}
                </li>
              ))}
            </ul>
          </div>

          <div className="profile-info-box profile-feedback">
            <h2>We&apos;d love to hear your thoughts and suggestions</h2>
            <div>
              <span>Submit a Feedback</span>
              <Link href="/submit-feedback">Send Feedback</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-field">
      <div>
        <strong>{label}</strong>
        {value && <span>{value}</span>}
      </div>
    </div>
  );
}

function ImageAdjustControls({
  className = '',
  fit,
  onChange,
  target,
}: {
  className?: string;
  fit: ProfileImageFit;
  onChange: (fit: ProfileImageFit) => void;
  target: string;
}) {
  return (
    <div className={`profile-photo-adjust${className ? ` ${className}` : ''}`} aria-label={`Adjust ${target}`}>
      <input
        type="range"
        aria-label={`Zoom ${target}`}
        min="1"
        max="2"
        step="0.05"
        value={fit.zoom}
        onChange={(event) => onChange({ ...fit, zoom: Number(event.target.value) })}
      />
      <input
        type="range"
        aria-label={`Move ${target} horizontally`}
        min="-25"
        max="25"
        step="1"
        value={fit.x}
        onChange={(event) => onChange({ ...fit, x: Number(event.target.value) })}
      />
      <input
        type="range"
        aria-label={`Move ${target} vertically`}
        min="-25"
        max="25"
        step="1"
        value={fit.y}
        onChange={(event) => onChange({ ...fit, y: Number(event.target.value) })}
      />
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="profile-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
