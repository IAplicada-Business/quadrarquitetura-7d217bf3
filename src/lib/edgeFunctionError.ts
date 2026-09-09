// supabase-js embrulha qualquer resposta não-2xx de uma Edge Function em
// FunctionsHttpError com a mensagem genérica "Edge Function returned a
// non-2xx status code" — o motivo real (arquivo grande demais, créditos
// acabaram, erro do gateway de IA) fica no corpo da resposta, que ninguém
// lê. Este helper extrai esse corpo para o toast mostrar algo acionável.
export async function edgeFunctionErrorMessage(
  err: unknown,
  fallback = "Erro desconhecido",
): Promise<string> {
  const context = (err as { context?: unknown })?.context;

  if (context instanceof Response) {
    try {
      const text = await context.clone().text();
      if (text) {
        try {
          const body = JSON.parse(text);
          const message = body?.error ?? body?.message;
          if (message) return String(message);
        } catch {
          // corpo não é JSON — usa o texto cru quando for curto o bastante
          if (text.length <= 300) return text;
        }
      }
    } catch {
      // corpo já consumido ou ilegível — cai no fallback abaixo
    }
  }

  const message = (err as { message?: unknown })?.message;
  return message ? String(message) : fallback;
}
