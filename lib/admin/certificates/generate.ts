import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";

/** Data required to stamp a certificate. */
export type CertificateData = {
  studentName: string;
  eventTitle: string;
  eventDate: string;
  organizer: string;
  organization: string;
  certificateId: string;
};

/* ------------------------------------------------------------------ */
/*  Layout constants (landscape A4: 842 × 595 pt)                    */
/* ------------------------------------------------------------------ */

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

/* Vertical positions are expressed from the page bottom (PDF origin). */
const TITLE_Y = PAGE_HEIGHT - 160;
const NAME_Y = PAGE_HEIGHT - 250;
const CONNECTOR_Y = PAGE_HEIGHT - 290;
const EVENT_Y = PAGE_HEIGHT - 330;
const DATE_Y = PAGE_HEIGHT - 390;
const ORGANIZER_Y = PAGE_HEIGHT - 420;
const CERT_ID_Y = 30;

/* ------------------------------------------------------------------ */
/*  Colours                                                           */
/* ------------------------------------------------------------------ */

const COLOR_TITLE = rgb(0.36, 0.25, 0.16);      /* dark brown   */
const COLOR_NAME = rgb(0.18, 0.12, 0.08);       /* near-black   */
const COLOR_BODY = rgb(0.33, 0.27, 0.22);       /* warm grey    */
const COLOR_ID = rgb(0.55, 0.48, 0.40);         /* muted brown  */

/* ------------------------------------------------------------------ */
/*  Template resolution                                               */
/* ------------------------------------------------------------------ */

const DEFAULT_TEMPLATE = path.join(
  process.cwd(),
  "public",
  "certificates",
  "default-template.png",
);

async function resolveTemplateBytes(templatePath?: string | null) {
  const resolved = templatePath ?? DEFAULT_TEMPLATE;

  try {
    return await fs.readFile(resolved);
  } catch {
    /* If the custom template is missing, fall back to default. */
    if (resolved !== DEFAULT_TEMPLATE) {
      return fs.readFile(DEFAULT_TEMPLATE);
    }

    throw new Error("Default certificate template not found");
  }
}

function isPng(bytes: Buffer) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

/* ------------------------------------------------------------------ */
/*  PDF generation                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generates a certificate PDF with the given data overlaid on a
 * background template image.
 *
 * @param data          The dynamic text to stamp onto the certificate.
 * @param templatePath  Absolute path to a custom template image.
 *                      Falls back to the default template when omitted.
 * @returns             The serialised PDF as a `Uint8Array`.
 */
export async function generateCertificatePdf(
  data: CertificateData,
  templatePath?: string | null,
): Promise<Uint8Array> {
  const templateBytes = await resolveTemplateBytes(templatePath);

  /* Create a blank landscape-A4 PDF. */
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  /* Embed the background image. */
  const bgImage = isPng(templateBytes)
    ? await pdfDoc.embedPng(templateBytes)
    : await pdfDoc.embedJpg(templateBytes);

  page.drawImage(bgImage, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });

  /* Embed fonts. */
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  /* Helper to draw centred text. */
  function drawCentered(
    text: string,
    y: number,
    size: number,
    font: typeof fontBold,
    color: ReturnType<typeof rgb>,
  ) {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (PAGE_WIDTH - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  }

  /* Title */
  drawCentered("CERTIFICATE OF ATTENDANCE", TITLE_Y, 26, fontBold, COLOR_TITLE);

  /* Student name */
  drawCentered(data.studentName, NAME_Y, 32, fontBold, COLOR_NAME);

  /* Connector */
  drawCentered("has successfully attended the event", CONNECTOR_Y, 13, fontRegular, COLOR_BODY);

  /* Event title */
  drawCentered(data.eventTitle, EVENT_Y, 20, fontBold, COLOR_BODY);

  /* Date */
  drawCentered(data.eventDate, DATE_Y, 12, fontRegular, COLOR_BODY);

  /* Organizer & organization */
  const organizerLine = [data.organizer, data.organization]
    .filter(Boolean)
    .join(" — ");

  if (organizerLine) {
    drawCentered(organizerLine, ORGANIZER_Y, 11, fontRegular, COLOR_BODY);
  }

  /* Certificate ID — bottom-right */
  page.drawText(data.certificateId, {
    x: PAGE_WIDTH - fontRegular.widthOfTextAtSize(data.certificateId, 8) - 30,
    y: CERT_ID_Y,
    size: 8,
    font: fontRegular,
    color: COLOR_ID,
  });

  return pdfDoc.save();
}
