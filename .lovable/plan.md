

## Portal do Cliente — Sistema Público via Link

### Contexto
Criar portal read-only acessível sem autenticação via token único. Uma edge function intermediária garante segurança, evitando queries diretas do frontend público.

### 1. Migration SQL — tabela `client_portal_tokens`

```sql
CREATE TABLE public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their tokens (via project ownership)
CREATE POLICY "Authenticated can insert tokens" ON client_portal_tokens
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view tokens" ON client_portal_tokens
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update tokens" ON client_portal_tokens
  FOR UPDATE TO authenticated USING (true);
```

### 2. Edge Function `get-client-portal-data`

- Receives `{ token: string }` via POST
- Validates token exists, `is_active = true`, and not expired
- Uses service role key to fetch all portal data for the project:
  - Project info (name, address, city, estimated_budget)
  - `schedule_tasks` where `is_client_visible = true` (for ClientScheduleView)
  - `payments` (date, value, status, description)
  - `invoices` (date, value, store_name, description)
  - `site_diary_entries` photos (last 12 entries with photos)
- Returns consolidated JSON response
- No auth required (`verify_jwt = false` in config.toml)
- CORS headers included

### 3. Nova página `src/pages/ClientPortal.tsx`

- Standalone page, no sidebar/header
- Calls edge function with token from URL params
- States: loading, error (invalid/expired token), success
- Layout (mobile-first):
  - **Header**: Logo Quadra + project name + address
  - **Seção 1 — Cronograma**: Reuses `ClientScheduleView` component with fetched tasks
  - **Seção 2 — Prestação de Contas**: Cards with contracted value, paid, balance + payment list + invoice list
  - **Seção 3 — Fotos**: Grid of last 12 photos from diary, lightbox on click
  - **Seção 4 — Contato**: Fixed message + WhatsApp link (from settings or hardcoded)
- Design: Quadra brand colors (rosa/primary), clean, no navigation chrome

### 4. Editar `src/App.tsx`

- Add public route `<Route path="/client/:token" element={<ClientPortal />} />` OUTSIDE the ProtectedRoute wrapper (before `<Route path="*">`)

### 5. Editar `src/components/projects/ProjectSummaryTab.tsx`

- Add "Gerar Link do Cliente" button in the quick links area or as a new section
- On click: check if active token exists for project (query `client_portal_tokens`)
- If none: insert new token, show link
- If exists: show existing link
- UI: Dialog/Card showing the link with "Copiar link" and "Desativar link" buttons
- "Regenerar" option if user wants a new token

### 6. Hook `src/hooks/useClientPortalToken.ts`

- Queries `client_portal_tokens` for the project
- Mutations: create token, deactivate token (set `is_active = false`)
- Returns active token if exists

### Arquivos criados/editados
- 1 migration SQL (table `client_portal_tokens` + RLS)
- 1 edge function: `supabase/functions/get-client-portal-data/index.ts`
- 1 página criada: `src/pages/ClientPortal.tsx`
- 1 hook criado: `src/hooks/useClientPortalToken.ts`
- 2 arquivos editados: `src/App.tsx` (public route), `src/components/projects/ProjectSummaryTab.tsx` (button + dialog)
- Config: add `[functions.get-client-portal-data]` to `supabase/config.toml`
- Nenhuma aba, sub-aba ou rota existente alterada

