import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { updateEventTemplate } from '@/lib/admin/db/events';
import { toErrorResponse } from '@/lib/admin/errors';
import { promises as fs } from 'fs';
import path from 'path';

const CERTIFICATES_DIR = path.join(process.cwd(), 'public', 'certificates');
const MAX_FILE_SIZE = 5 * 1024 * 1024; /* 5 MB */
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

/**
 * Uploads a custom certificate background template for a specific event.
 *
 * Accepts `multipart/form-data` with:
 *   - `eventId`  — the target event
 *   - `template` — the image file (PNG or JPG, max 5 MB)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const eventId = formData.get('eventId');
    const file = formData.get('template');

    if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
      return NextResponse.json(
        { error: 'eventId is required', code: 400 },
        { status: 400 },
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'template file is required (PNG or JPG)', code: 400 },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only PNG and JPG images are accepted', code: 400 },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be under 5 MB', code: 400 },
        { status: 400 },
      );
    }

    /* Determine extension from MIME type. */
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `${eventId.trim()}.${ext}`;
    const filePath = path.join(CERTIFICATES_DIR, fileName);

    /* Ensure the certificates directory exists. */
    await fs.mkdir(CERTIFICATES_DIR, { recursive: true });

    /* Write the uploaded file to disk. */
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    /* Persist the template path on the event document. */
    const templateUrl = `/certificates/${fileName}`;
    await updateEventTemplate(eventId.trim(), filePath, templateUrl);

    return NextResponse.json(
      {
        success: true,
        templateUrl,
        fileName,
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Returns the current certificate template info for a given event.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const eventId = request.nextUrl.searchParams.get('eventId')?.trim();

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId query parameter is required', code: 400 },
        { status: 400 },
      );
    }

    /* Check for a custom template on disk. */
    const pngPath = path.join(CERTIFICATES_DIR, `${eventId}.png`);
    const jpgPath = path.join(CERTIFICATES_DIR, `${eventId}.jpg`);

    let customPath: string | null = null;
    let customUrl: string | null = null;

    try {
      await fs.access(pngPath);
      customPath = pngPath;
      customUrl = `/certificates/${eventId}.png`;
    } catch {
      try {
        await fs.access(jpgPath);
        customPath = jpgPath;
        customUrl = `/certificates/${eventId}.jpg`;
      } catch {
        /* No custom template found. */
      }
    }

    return NextResponse.json(
      {
        eventId,
        hasCustomTemplate: customPath !== null,
        templateUrl: customUrl ?? '/certificates/default-template.png',
        isDefault: customPath === null,
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
