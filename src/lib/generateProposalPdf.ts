import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PAGE_W, PAGE_H } from "@/components/leads/proposal-pages/shared";

// A4 in points: 595.28 x 841.89
const A4_W_PT = 595.28;
const A4_H_PT = 841.89;

export async function generateProposalPdf(
  pages: React.ReactElement[],
  renderPage: (page: React.ReactElement, index: number) => HTMLElement | null
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  for (let i = 0; i < pages.length; i++) {
    const el = renderPage(pages[i], i);
    if (!el) continue;

    const canvas = await html2canvas(el, {
      width: PAGE_W,
      height: PAGE_H,
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(imgData, "PNG", 0, 0, A4_W_PT, A4_H_PT);
  }

  return pdf.output("blob");
}
