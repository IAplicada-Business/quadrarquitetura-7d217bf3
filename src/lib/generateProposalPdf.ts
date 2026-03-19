import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PAGE_W, PAGE_H } from "@/components/leads/proposal-pages/shared";

export async function generateProposalPdf(
  pages: React.ReactElement[],
  renderPage: (page: React.ReactElement, index: number) => HTMLElement | null
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [PAGE_W, PAGE_H],
  });

  for (let i = 0; i < pages.length; i++) {
    const el = renderPage(pages[i], i);
    if (!el) continue;

    const canvas = await html2canvas(el, {
      width: PAGE_W,
      height: PAGE_H,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "landscape");
    pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W, PAGE_H);
  }

  return pdf.output("blob");
}
