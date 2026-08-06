/**
 * Converte strings vazias em null no payload antes de enviar ao Postgres.
 *
 * Inputs de <input type="date"> (e vários campos opcionais do formulário)
 * ficam como "" quando vazios. O PostgREST/Postgres rejeita isso em colunas
 * `date` com: invalid input syntax for type date: "" (SQLSTATE 22007).
 */
export function sanitizeEmptyStrings<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = { ...payload };
  for (const [key, value] of Object.entries(out)) {
    if (value === "") out[key] = null;
  }
  return out as T;
}
