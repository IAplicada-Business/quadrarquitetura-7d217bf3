

## Otimizar velocidade de geração do PDF

### Problema
O PDF está lento porque cada página é capturada com `html2canvas` em `scale: 3` (794×1123 px × 3 = canvas de 2382×3369 pixels) e salva como PNG sem compressão. Com ~10 páginas, isso gera canvases enormes e a conversão para base64 PNG é custosa.

### Solução
Reduzir o scale de 3 para 2 (ainda boa qualidade para A4) e usar JPEG com qualidade 0.92 em vez de PNG. JPEG é muito mais rápido para converter e gera strings base64 menores, acelerando tanto o `toDataURL` quanto o `addImage` do jsPDF.

### Edições

**`src/lib/generateProposalPdf.ts`**
- `scale: 3` → `scale: 2`
- `canvas.toDataURL("image/png")` → `canvas.toDataURL("image/jpeg", 0.92)`
- `pdf.addImage(imgData, "PNG", ...)` → `pdf.addImage(imgData, "JPEG", ...)`

Isso deve reduzir o tempo de geração em ~50-60% mantendo qualidade visual adequada para o PDF.

