import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PAGE_W, PAGE_H } from "@/components/leads/proposal-pages/shared";

// PDF dimensions in points matching the 595×842 pixel template
const PDF_W_PT = 595.28;
const PDF_H_PT = 841.89;

/**
 * Pre-loads all font weights used in proposal pages.
 * Must be called before html2canvas capture to avoid missing glyphs.
 */
export async function waitForFonts(): Promise<void> {
  const fontFaces = [
    "300 16px 'Cormorant Garamond'",
    "400 16px 'Cormorant Garamond'",
    "600 16px 'Cormorant Garamond'",
    "700 16px 'Cormorant Garamond'",
    "300 16px 'Jost'",
    "400 16px 'Jost'",
    "500 16px 'Jost'",
    "600 16px 'Jost'",
  ];
  await Promise.all(fontFaces.map(f => document.fonts.load(f)));
  await document.fonts.ready;
}

export async function generateProposalPdf(
  pages: React.ReactElement[],
  renderPage: (page: React.ReactElement, index: number) => HTMLElement | null,
): Promise<Blob> {

  // Ensure fonts are loaded before capturing
  await waitForFonts();

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [PDF_W_PT, PDF_H_PT],
  });

  for (let i = 0; i < pages.length; i++) {
    const el = renderPage(pages[i], i);
    if (!el) continue;

    const canvas = await html2canvas(el, {
      width: PAGE_W,
      height: PAGE_H,
      scale: 3,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage([PDF_W_PT, PDF_H_PT], "portrait");
    pdf.addImage(imgData, "PNG", 0, 0, PDF_W_PT, PDF_H_PT);
  }

  return pdf.output("blob");
}
