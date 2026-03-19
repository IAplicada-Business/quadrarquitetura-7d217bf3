ALTER TABLE budget_quotes
  ADD CONSTRAINT fk_budget_quotes_scope_item
  FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE CASCADE;

ALTER TABLE material_tracking
  ADD CONSTRAINT fk_material_tracking_budget_quote
  FOREIGN KEY (budget_quote_id) REFERENCES budget_quotes(id) ON DELETE CASCADE;