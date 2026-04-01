import type { Database } from "@/integrations/supabase/types";

// ── Row type helpers ──
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// ── Commonly used row types ──
export type InvoiceNF = Tables<"invoices_nf">;
export type ProjectActivity = Tables<"project_activities">;
export type PriceResearch = Tables<"price_research">;
export type MaterialIndex = Tables<"material_indices">;
export type LaborCost = Tables<"labor_costs">;
export type SupplierScope = Tables<"supplier_scopes">;
export type WeeklyReport = Tables<"weekly_reports">;
export type Lead = Tables<"leads">;
export type Proposal = Tables<"proposals">;
export type Payment = Tables<"payments">;
export type Project = Tables<"projects">;
export type Client = Tables<"clients">;
export type Supplier = Tables<"suppliers">;
export type ScopeItem = Tables<"scope_items">;
export type BudgetQuote = Tables<"budget_quotes">;
export type ScheduleTask = Database["public"]["Tables"]["schedule_tasks"] extends { Row: infer R } ? R : never;
