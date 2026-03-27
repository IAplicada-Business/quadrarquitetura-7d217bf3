
-- ============================================
-- Migrar RLS de 16 tabelas para equipe
-- ============================================

-- 1. scope_items
DROP POLICY IF EXISTS "Users can view own scope_items" ON public.scope_items;
DROP POLICY IF EXISTS "Users can create scope_items" ON public.scope_items;
DROP POLICY IF EXISTS "Users can update own scope_items" ON public.scope_items;
DROP POLICY IF EXISTS "Users can delete own scope_items" ON public.scope_items;
CREATE POLICY "Team can view scope_items" ON public.scope_items FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create scope_items" ON public.scope_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update scope_items" ON public.scope_items FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete scope_items" ON public.scope_items FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 2. schedule_tasks
DROP POLICY IF EXISTS "Users can view own schedule_tasks" ON public.schedule_tasks;
DROP POLICY IF EXISTS "Users can create schedule_tasks" ON public.schedule_tasks;
DROP POLICY IF EXISTS "Users can update own schedule_tasks" ON public.schedule_tasks;
DROP POLICY IF EXISTS "Users can delete own schedule_tasks" ON public.schedule_tasks;
CREATE POLICY "Team can view schedule_tasks" ON public.schedule_tasks FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create schedule_tasks" ON public.schedule_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update schedule_tasks" ON public.schedule_tasks FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete schedule_tasks" ON public.schedule_tasks FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 3. scenarios
DROP POLICY IF EXISTS "Users can view own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can create scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON public.scenarios;
CREATE POLICY "Team can view scenarios" ON public.scenarios FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create scenarios" ON public.scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update scenarios" ON public.scenarios FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete scenarios" ON public.scenarios FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 4. site_tracking
DROP POLICY IF EXISTS "Users can view own tracking" ON public.site_tracking;
DROP POLICY IF EXISTS "Users can create tracking" ON public.site_tracking;
DROP POLICY IF EXISTS "Users can update own tracking" ON public.site_tracking;
DROP POLICY IF EXISTS "Users can delete own tracking" ON public.site_tracking;
CREATE POLICY "Team can view site_tracking" ON public.site_tracking FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create site_tracking" ON public.site_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update site_tracking" ON public.site_tracking FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete site_tracking" ON public.site_tracking FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 5. site_visits
DROP POLICY IF EXISTS "Users can view own site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can insert own site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can update own site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can delete own site_visits" ON public.site_visits;
CREATE POLICY "Team can view site_visits" ON public.site_visits FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create site_visits" ON public.site_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update site_visits" ON public.site_visits FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete site_visits" ON public.site_visits FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 6. material_tracking
DROP POLICY IF EXISTS "Users can view own material_tracking" ON public.material_tracking;
DROP POLICY IF EXISTS "Users can create material_tracking" ON public.material_tracking;
DROP POLICY IF EXISTS "Users can update own material_tracking" ON public.material_tracking;
DROP POLICY IF EXISTS "Users can delete own material_tracking" ON public.material_tracking;
CREATE POLICY "Team can view material_tracking" ON public.material_tracking FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create material_tracking" ON public.material_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update material_tracking" ON public.material_tracking FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete material_tracking" ON public.material_tracking FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 7. material_calculations
DROP POLICY IF EXISTS "Users can view own material_calculations" ON public.material_calculations;
DROP POLICY IF EXISTS "Users can create material_calculations" ON public.material_calculations;
DROP POLICY IF EXISTS "Users can update own material_calculations" ON public.material_calculations;
DROP POLICY IF EXISTS "Users can delete own material_calculations" ON public.material_calculations;
CREATE POLICY "Team can view material_calculations" ON public.material_calculations FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create material_calculations" ON public.material_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update material_calculations" ON public.material_calculations FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete material_calculations" ON public.material_calculations FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 8. budget_quote_items
DROP POLICY IF EXISTS "Users can view own budget_quote_items" ON public.budget_quote_items;
DROP POLICY IF EXISTS "Users can create budget_quote_items" ON public.budget_quote_items;
DROP POLICY IF EXISTS "Users can update own budget_quote_items" ON public.budget_quote_items;
DROP POLICY IF EXISTS "Users can delete own budget_quote_items" ON public.budget_quote_items;
CREATE POLICY "Team can view budget_quote_items" ON public.budget_quote_items FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create budget_quote_items" ON public.budget_quote_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update budget_quote_items" ON public.budget_quote_items FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete budget_quote_items" ON public.budget_quote_items FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 9. budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Team can view budgets" ON public.budgets FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update budgets" ON public.budgets FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete budgets" ON public.budgets FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 10. payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;
CREATE POLICY "Team can view payments" ON public.payments FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update payments" ON public.payments FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete payments" ON public.payments FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 11. invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Team can view invoices" ON public.invoices FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update invoices" ON public.invoices FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete invoices" ON public.invoices FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 12. documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Team can view documents" ON public.documents FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update documents" ON public.documents FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete documents" ON public.documents FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 13. supplier_allocations
DROP POLICY IF EXISTS "Users can view own allocations" ON public.supplier_allocations;
DROP POLICY IF EXISTS "Users can insert own allocations" ON public.supplier_allocations;
DROP POLICY IF EXISTS "Users can update own allocations" ON public.supplier_allocations;
DROP POLICY IF EXISTS "Users can delete own allocations" ON public.supplier_allocations;
CREATE POLICY "Team can view supplier_allocations" ON public.supplier_allocations FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create supplier_allocations" ON public.supplier_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update supplier_allocations" ON public.supplier_allocations FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete supplier_allocations" ON public.supplier_allocations FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 14. suppliers
DROP POLICY IF EXISTS "Users can view own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON public.suppliers;
CREATE POLICY "Team can view suppliers" ON public.suppliers FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update suppliers" ON public.suppliers FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete suppliers" ON public.suppliers FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 15. proposal_assets
DROP POLICY IF EXISTS "Users can view own proposal_assets" ON public.proposal_assets;
DROP POLICY IF EXISTS "Users can insert own proposal_assets" ON public.proposal_assets;
DROP POLICY IF EXISTS "Users can update own proposal_assets" ON public.proposal_assets;
DROP POLICY IF EXISTS "Users can delete own proposal_assets" ON public.proposal_assets;
CREATE POLICY "Team can view proposal_assets" ON public.proposal_assets FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create proposal_assets" ON public.proposal_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update proposal_assets" ON public.proposal_assets FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete proposal_assets" ON public.proposal_assets FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- 16. contract_templates
DROP POLICY IF EXISTS "Users can view own contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can create contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can update own contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can delete own contract_templates" ON public.contract_templates;
CREATE POLICY "Team can view contract_templates" ON public.contract_templates FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create contract_templates" ON public.contract_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update contract_templates" ON public.contract_templates FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete contract_templates" ON public.contract_templates FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
