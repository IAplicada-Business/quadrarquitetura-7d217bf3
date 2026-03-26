import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PAGE_W, PAGE_H, PAGE_W_16_9, PAGE_H_16_9 } from "@/components/leads/proposal-pages/shared";

// PDF dimensions in points matching the 595×842 pixel template
const PDF_W_PT = 595.28;
const PDF_H_PT = 841.89;

// 16:9 landscape dimensions in points (1280×720 ratio)
const PDF_W_16_9_PT = 960;
const PDF_H_16_9_PT = 540;

export async function generateProposalPdf(
  pages: React.ReactElement[],
  renderPage: (page: React.ReactElement, index: number) => HTMLElement | null,
  formato: "a4" | "apresentacao" = "a4"
): Promise<Blob> {
  const isPresentation = formato === "apresentacao";
  const pdfW = isPresentation ? PDF_W_16_9_PT : PDF_W_PT;
  const pdfH = isPresentation ? PDF_H_16_9_PT : PDF_H_PT;
  const canvasW = isPresentation ? PAGE_W_16_9 : PAGE_W;
  const canvasH = isPresentation ? PAGE_H_16_9 : PAGE_H;

  const pdf = new jsPDF({
    orientation: isPresentation ? "landscape" : "portrait",
    unit: "pt",
    format: [pdfW, pdfH],
  });

  for (let i = 0; i < pages.length; i++) {
    const el = renderPage(pages[i], i);
    if (!el) continue;

    const canvas = await html2canvas(el, {
      width: canvasW,
      height: canvasH,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    if (i > 0) pdf.addPage([pdfW, pdfH], isPresentation ? "landscape" : "portrait");
    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
  }

  return pdf.output("blob");
}
