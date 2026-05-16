import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth/roleGuard';
import { generateAndSaveCertificate } from '@/lib/admin/db/certificates';
import { toErrorResponse } from '@/lib/admin/errors';

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

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required', code: 400 },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 400 },
        { status: 400 },
      );
    }

    const result = await generateAndSaveCertificate(eventId, userId);

    const fileName = `certificate-${result.certificateId}.pdf`;
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
