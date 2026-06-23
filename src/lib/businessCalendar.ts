// Calendário brasileiro para cálculo de prazos de obra.
//
// Implementa os Prompts 2, 3 e 4 do guia "Imersão Cronograma 2.0" da
// Mariana: calcular datas reais a partir de duração em dias úteis,
// respeitando feriados nacionais, recesso de fim de ano (20/12 a 05/01)
// e estaduais/municipais quando informados.
//
// Optamos por implementar em TypeScript puro (sem IA) porque calendário
// é determinístico: chamar Gemini para isso seria caro e sujeito a
// alucinação. A IA do guia entra apenas na geração do escopo
// (`generate-activities`) e nos checkpoints (`generate-checkpoints`).

/**
 * Calcula a data da Páscoa (Domingo) pelo algoritmo de Meeus/Jones/Butcher.
 * Base para feriados móveis: Carnaval (-47d), Sexta-feira Santa (-2d),
 * Corpus Christi (+60d).
 */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Conjunto de datas (YYYY-MM-DD) que são feriados no ano. */
export function holidaysForYear(year: number, extras: string[] = []): Set<string> {
  const easter = easterSunday(year);
  const set = new Set<string>([
    // Feriados nacionais fixos
    `${year}-01-01`, // Confraternização
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Trabalho
    `${year}-09-07`, // Independência
    `${year}-10-12`, // Padroeira
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-11-20`, // Consciência Negra
    `${year}-12-25`, // Natal
    // Móveis
    toIsoDate(addDaysUtc(easter, -48)), // Segunda de Carnaval
    toIsoDate(addDaysUtc(easter, -47)), // Terça de Carnaval
    toIsoDate(addDaysUtc(easter, -46)), // Quarta-feira de Cinzas (meio-período, mas tratamos como feriado)
    toIsoDate(addDaysUtc(easter, -2)), // Sexta-feira Santa
    toIsoDate(addDaysUtc(easter, 60)), // Corpus Christi
  ]);
  for (const e of extras) set.add(e);
  return set;
}

/** Datas do recesso de fim de ano (20/12 a 05/01 do ano seguinte). */
export function yearEndRecessFor(year: number): Set<string> {
  const set = new Set<string>();
  for (let d = 20; d <= 31; d++) set.add(`${year}-12-${String(d).padStart(2, "0")}`);
  for (let d = 1; d <= 5; d++) set.add(`${year + 1}-01-${String(d).padStart(2, "0")}`);
  return set;
}

export interface BusinessDayOptions {
  /** Considera recesso de 20/12 a 05/01 como não-útil. Default true. */
  includeYearEndRecess?: boolean;
  /** Feriados municipais/estaduais adicionais (YYYY-MM-DD). */
  extraHolidays?: string[];
}

/**
 * Retorna true se a data é dia útil (não é fim de semana, feriado nem
 * cai dentro do recesso de fim de ano).
 */
export function isBusinessDay(date: Date, opts: BusinessDayOptions = {}): boolean {
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  const iso = toIsoDate(date);
  const year = date.getUTCFullYear();
  const holidays = holidaysForYear(year, opts.extraHolidays);
  if (holidays.has(iso)) return false;
  if (opts.includeYearEndRecess !== false) {
    const recess = yearEndRecessFor(year);
    // Janeiro do ano seguinte também: gera recesso do ano anterior
    const recessPrev = yearEndRecessFor(year - 1);
    if (recess.has(iso) || recessPrev.has(iso)) return false;
  }
  return true;
}

/**
 * Soma `businessDays` dias úteis a `start`. Se `start` cai em dia
 * não-útil, avança para o próximo dia útil antes de contar.
 */
export function addBusinessDays(
  start: Date,
  businessDays: number,
  opts: BusinessDayOptions = {},
): Date {
  let cur = new Date(start.getTime());
  while (!isBusinessDay(cur, opts)) {
    cur = addDaysUtc(cur, 1);
  }
  let remaining = businessDays;
  while (remaining > 0) {
    cur = addDaysUtc(cur, 1);
    if (isBusinessDay(cur, opts)) remaining--;
  }
  return cur;
}

export interface ScheduleStep {
  id: string;
  name: string;
  /** Duração em dias úteis. */
  duration_days: number;
  /** IDs de outras etapas que precisam estar concluídas antes desta começar. */
  depends_on?: string[];
}

export interface ComputedStep extends ScheduleStep {
  start_date: string;
  end_date: string;
}

/**
 * Materializa um cronograma a partir de uma data de início e uma lista
 * de etapas com dependências. Implementa o Prompt 4 do guia ("Linha do
 * tempo com datas reais"):
 *
 *  - cada etapa começa no próximo dia útil após o `end_date` da última
 *    de suas dependências (ou na data de início do projeto se não tem);
 *  - duração é em dias úteis, pulando feriados e recesso.
 *
 * Etapas paralelas (sem dependência mútua) começam na mesma data e
 * podem terminar em datas diferentes.
 */
export function buildTimeline(
  steps: ScheduleStep[],
  projectStart: string | Date,
  opts: BusinessDayOptions = {},
): ComputedStep[] {
  const start = typeof projectStart === "string"
    ? new Date(projectStart + "T00:00:00Z")
    : projectStart;

  const byId = new Map<string, ComputedStep>();
  const computed: ComputedStep[] = [];

  // Resolve topologicamente. Tolerante a ciclos: se detectar um ciclo,
  // ignora a dependência cíclica e usa a data de início do projeto.
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function compute(stepId: string) {
    if (visited.has(stepId)) return;
    if (inStack.has(stepId)) return; // ciclo — quebra
    inStack.add(stepId);

    const step = steps.find((s) => s.id === stepId);
    if (!step) {
      inStack.delete(stepId);
      return;
    }

    let earliestStart = start;
    for (const depId of step.depends_on ?? []) {
      compute(depId);
      const dep = byId.get(depId);
      if (dep) {
        const depEnd = new Date(dep.end_date + "T00:00:00Z");
        const candidate = addDaysUtc(depEnd, 1);
        if (candidate.getTime() > earliestStart.getTime()) earliestStart = candidate;
      }
    }

    // Avança para próximo dia útil
    let actualStart = earliestStart;
    while (!isBusinessDay(actualStart, opts)) {
      actualStart = addDaysUtc(actualStart, 1);
    }
    const actualEnd = addBusinessDays(actualStart, Math.max(0, step.duration_days - 1), opts);

    const result: ComputedStep = {
      ...step,
      start_date: toIsoDate(actualStart),
      end_date: toIsoDate(actualEnd),
    };
    byId.set(stepId, result);
    computed.push(result);
    visited.add(stepId);
    inStack.delete(stepId);
  }

  for (const s of steps) compute(s.id);
  return computed;
}
