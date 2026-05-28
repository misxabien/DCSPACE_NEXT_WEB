import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import {
  getCertificateTemplateInfo,
  saveCertificateTemplate,
} from '@/lib/admin/db/certificates';
import { toErrorResponse } from '@/lib/admin/errors';

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

    const trimmedEventId = eventId.trim();
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const fallbackFileName = `${trimmedEventId}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const savedTemplate = await saveCertificateTemplate(trimmedEventId, {
      fileName: file.name || fallbackFileName,
      contentType: file.type,
      data: Buffer.from(arrayBuffer),
    });

    return NextResponse.json(
      {
        success: true,
        ...savedTemplate,
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

    const templateInfo = await getCertificateTemplateInfo(eventId);

    return NextResponse.json(
      {
        ...templateInfo,
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
