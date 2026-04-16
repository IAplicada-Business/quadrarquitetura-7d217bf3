import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { generateProposalPdf, waitForFonts } from "./generateProposalPdf";
import { buildContractPages } from "@/components/leads/ContractPageRenderer";
import type { ContractPageProps } from "@/components/leads/contract-pages/shared";
import { supabase } from "@/integrations/supabase/client";

export async function generateContractPdf(contractData: ContractPageProps): Promise<Blob> {
  const pages = buildContractPages(contractData);

  // Create offscreen container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const roots: ReturnType<typeof createRoot>[] = [];
  const pageElements: HTMLDivElement[] = [];

  // Render each page to DOM synchronously
  for (let i = 0; i < pages.length; i++) {
    const pageDiv = document.createElement("div");
    container.appendChild(pageDiv);
    const root = createRoot(pageDiv);
    roots.push(root);

    flushSync(() => {
      root.render(pages[i]);
    });

    pageElements.push(pageDiv);
  }

  // Wait for images to load
  const allImages = container.querySelectorAll("img");
  await Promise.all(
    Array.from(allImages).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  );

  // Wait for fonts
  await waitForFonts();

  // Generate PDF using the same engine as proposals
  const blob = await generateProposalPdf(
    pages,
    (_page, index) => {
      return (pageElements[index]?.firstElementChild as HTMLElement) || null;
    },
    "a4"
  );

  // Cleanup
  roots.forEach((r) => r.unmount());
  document.body.removeChild(container);

  return blob;
}

export async function downloadContractPdf(blob: Blob, clientName: string): Promise<void> {
  const safeName = (clientName || "contrato").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `contrato-${safeName}-${Date.now()}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function uploadContractPdf(blob: Blob, clientName: string): Promise<string | null> {
  try {
    const safeName = (clientName || "contrato").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
    const fileName = `contracts/contrato-${safeName}-${Date.now()}.pdf`;

    const { error } = await supabase.storage
      .from("proposal-assets")
      .upload(fileName, blob, { contentType: "application/pdf", upsert: true });

    if (error) {
      console.error("Error uploading contract PDF:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("proposal-assets").getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}
