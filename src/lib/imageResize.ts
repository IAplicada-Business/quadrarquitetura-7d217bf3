/**
 * Redimensiona uma imagem no navegador antes do upload.
 *
 * Fotos de celular chegam com 4000px+ e vários MB; o site não precisa disso.
 * Reduz para no máximo `maxWidth` de largura (mantendo proporção) e recomprime:
 * PNG continua PNG (logo com transparência), o resto vira JPEG. SVG e GIF
 * passam direto (vetor / animação).
 */
export interface ResizeResult {
  blob: Blob;
  contentType: string;
  ext: string;
  width: number;
  height: number;
}

export function targetSize(width: number, height: number, maxWidth: number): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) };
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}

export async function resizeImage(file: File, maxWidth: number, quality = 0.85): Promise<ResizeResult> {
  const type = file.type || "";
  if (!type.startsWith("image/")) throw new Error("O arquivo precisa ser uma imagem");
  if (type === "image/svg+xml" || type === "image/gif") {
    return { blob: file, contentType: type, ext: type === "image/gif" ? "gif" : "svg", width: 0, height: 0 };
  }

  const img = await loadImage(file);
  const { width, height } = targetSize(img.naturalWidth, img.naturalHeight, maxWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Navegador sem suporte a redimensionar imagem");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const keepPng = type === "image/png";
  const contentType = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao comprimir a imagem"))), contentType, quality),
  );
  return { blob, contentType, ext: keepPng ? "png" : "jpg", width, height };
}
