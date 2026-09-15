/** Regras de exibição do popup de aprovação do autor (Bruno 04/08). */

export const OPORT_APROVACAO_STORAGE_KEY = "quadra.oportunidades.aprovacao.remind";
export const OPORT_APROVACAO_HORA_MS = 60 * 60 * 1000;

export type RemindState = {
  /** Dia civil America/Sao_Paulo YYYY-MM-DD da última exibição "do dia". */
  day: string;
  /** ISO da última vez que o dialog foi mostrado. */
  lastShownAt: string;
  /** ISO até quando está adiado após "Lembrar depois". */
  snoozeUntil: string | null;
};

export function diaSaoPaulo(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function loadRemindState(): RemindState | null {
  try {
    const raw = localStorage.getItem(OPORT_APROVACAO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RemindState;
  } catch {
    return null;
  }
}

export function saveRemindState(s: RemindState) {
  try {
    localStorage.setItem(OPORT_APROVACAO_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Decide se o popup deve abrir agora, dado o estado de snooze/dia. */
export function deveMostrarReminder(now = new Date(), state: RemindState | null = null): boolean {
  const s = state;
  const hoje = diaSaoPaulo(now);
  if (!s) return true;
  if (s.day !== hoje) return true;
  if (s.snoozeUntil) {
    return now.getTime() >= new Date(s.snoozeUntil).getTime();
  }
  const last = new Date(s.lastShownAt).getTime();
  return now.getTime() - last >= OPORT_APROVACAO_HORA_MS;
}
