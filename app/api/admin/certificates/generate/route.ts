import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { generateAndSaveCertificate } from '@/lib/admin/db/certificates';
import { generateCertificatePdf, type CertificateData } from '@/lib/admin/certificates/generate';
import { toErrorResponse } from '@/lib/admin/errors';

function pickText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'certificate';
}

async function generateMockupCertificate(body: Record<string, unknown>) {
  const event = body.event && typeof body.event === 'object'
    ? body.event as Record<string, unknown>
    : {};
  const attendee = body.attendee && typeof body.attendee === 'object'
    ? body.attendee as Record<string, unknown>
    : {};
  const now = new Date();
  const studentName = pickText(
    body.studentName,
    body.attendeeName,
    attendee.name,
    attendee.fullName,
    attendee.studentName,
    attendee.studentNumber,
    body.studentNumber,
    'Sample Student',
  );
  const eventTitle = pickText(
    body.eventTitle,
    event.title,
    event.name,
    'Sample Event',
  );
  const certificateId = pickText(
    body.certificateId,
    `DC-MOCK-${now.getTime().toString(36).toUpperCase()}`,
  );
  const data: CertificateData = {
    studentName,
    eventTitle,
    eventDate: pickText(body.eventDate, event.date, 'TBA'),
    organizer: pickText(body.organizer, event.organizer, 'DC Space'),
    organization: pickText(body.organization, event.organization, 'Domini Xode'),
    certificateId,
  };
  const pdfBytes = await generateCertificatePdf(data);

  return {
    pdfBytes,
    certificateId,
    studentName,
    eventTitle,
  };
}

/**
 * Generates and returns a downloadable PDF certificate for a student
 * who has completed attendance at a specific event.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = (await request.json()) as Record<string, unknown>;
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const shouldGenerateMockup = body.mockup === true || body.mockCertificate === true;

    if (!shouldGenerateMockup && !eventId) {
      return NextResponse.json(
        { error: 'eventId is required', code: 400 },
        { status: 400 },
      );
    }

    if (!shouldGenerateMockup && !userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 400 },
        { status: 400 },
      );
    }

    const result = shouldGenerateMockup
      ? await generateMockupCertificate(body)
      : await generateAndSaveCertificate(eventId, userId);

    const fileName = `certificate-${sanitizeFilePart(result.studentName)}-${sanitizeFilePart(result.eventTitle)}.pdf`;
    const pdfBuffer = Buffer.from(result.pdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
