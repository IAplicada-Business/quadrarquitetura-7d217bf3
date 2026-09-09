import { describe, it, expect } from "vitest";
import { edgeFunctionErrorMessage } from "@/lib/edgeFunctionError";

// Reprodução do encoder das edge functions (analyze-plant / generate-memorial).
// O bug: btoa(String.fromCharCode(...bytes)) estoura o limite de argumentos
// do V8 e derruba a função com "Maximum call stack size exceeded" — toda
// planta real (>64KB) caía nisso e o front só via "non-2xx status code".
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

describe("bytesToBase64 (encoder das edge functions)", () => {
  it("codifica arquivo grande sem estourar a pilha", () => {
    const bytes = new Uint8Array(3 * 1024 * 1024);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;

    const encoded = bytesToBase64(bytes);
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    expect(decoded.length).toBe(bytes.length);
    expect(decoded[0]).toBe(bytes[0]);
    expect(decoded[decoded.length - 1]).toBe(bytes[bytes.length - 1]);
  });

  it("a versão antiga realmente quebra no mesmo arquivo", () => {
    const bytes = new Uint8Array(3 * 1024 * 1024);
    expect(() => btoa(String.fromCharCode(...bytes))).toThrow();
  });
});

describe("edgeFunctionErrorMessage", () => {
  it("extrai o erro do corpo da resposta", async () => {
    const err = Object.assign(new Error("Edge Function returned a non-2xx status code"), {
      context: new Response(JSON.stringify({ error: "Arquivo muito grande (31.2MB)." }), { status: 400 }),
    });
    expect(await edgeFunctionErrorMessage(err)).toBe("Arquivo muito grande (31.2MB).");
  });

  it("usa a mensagem do erro quando não há corpo útil", async () => {
    expect(await edgeFunctionErrorMessage(new Error("falha de rede"))).toBe("falha de rede");
  });

  it("cai no fallback quando não há nada", async () => {
    expect(await edgeFunctionErrorMessage({}, "Erro ao analisar planta")).toBe("Erro ao analisar planta");
  });
});
