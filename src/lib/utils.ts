import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mensagem legível de um erro qualquer (Error, erro do Supabase/PostgREST ou
 * o que vier). Serve pra não cair num "[object Object]" no toast — erro de
 * banco chega como `{ message, code }`, que não é `instanceof Error`.
 */
export function msgErro(e: unknown, fallback = "Algo deu errado."): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e.trim()) return e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}
