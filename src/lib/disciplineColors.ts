export const DISCIPLINE_COLOR_MAP: Record<string, string> = {
  "Alvenaria": "#8B5E3C",
  "Elétrica": "#F59E0B",
  "Hidráulica": "#3B82F6",
  "Pintura": "#EC4899",
  "Acabamento": "#8B5CF6",
  "Demolição": "#EF4444",
  "Estrutura": "#6B7280",
  "Impermeabilização": "#06B6D4",
  "Esquadrias": "#14B8A6",
  "Automação": "#6366F1",
  "Ar-condicionado": "#0EA5E9",
  "Gesso/Forro": "#D4D4D8",
  "Revestimento": "#A855F7",
  "Marcenaria": "#92400E",
  "Piso": "#78716C",
};

const DEFAULT_COLOR = "#9CA3AF";

export function getDisciplineColor(discipline: string | null | undefined): string {
  if (!discipline) return DEFAULT_COLOR;
  // Try exact match first
  if (DISCIPLINE_COLOR_MAP[discipline]) return DISCIPLINE_COLOR_MAP[discipline];
  // Try case-insensitive partial match
  const lower = discipline.toLowerCase();
  for (const [key, color] of Object.entries(DISCIPLINE_COLOR_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return color;
    }
  }
  return DEFAULT_COLOR;
}
