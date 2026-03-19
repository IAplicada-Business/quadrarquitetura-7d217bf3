-- Remove duplicate FK on budget_quotes.scope_item_id
ALTER TABLE budget_quotes DROP CONSTRAINT IF EXISTS budget_quotes_scope_item_id_fkey;

-- discipline_priorities → CASCADE
ALTER TABLE discipline_priorities 
  DROP CONSTRAINT IF EXISTS discipline_priorities_scope_item_id_fkey,
  ADD CONSTRAINT discipline_priorities_scope_item_id_fkey 
    FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE CASCADE;

-- discipline_material_estimates → CASCADE
ALTER TABLE discipline_material_estimates 
  DROP CONSTRAINT IF EXISTS discipline_material_estimates_scope_item_id_fkey,
  ADD CONSTRAINT discipline_material_estimates_scope_item_id_fkey 
    FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE CASCADE;

-- schedule_tasks → SET NULL
ALTER TABLE schedule_tasks 
  DROP CONSTRAINT IF EXISTS schedule_tasks_scope_item_id_fkey,
  ADD CONSTRAINT schedule_tasks_scope_item_id_fkey 
    FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE SET NULL;

-- scope_items.parent_id → SET NULL
ALTER TABLE scope_items 
  DROP CONSTRAINT IF EXISTS scope_items_parent_id_fkey,
  ADD CONSTRAINT scope_items_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES scope_items(id) ON DELETE SET NULL;

-- budget_quote_items → CASCADE
ALTER TABLE budget_quote_items 
  DROP CONSTRAINT IF EXISTS budget_quote_items_budget_quote_id_fkey,
  ADD CONSTRAINT budget_quote_items_budget_quote_id_fkey 
    FOREIGN KEY (budget_quote_id) REFERENCES budget_quotes(id) ON DELETE CASCADE;

-- payments → SET NULL
ALTER TABLE payments 
  DROP CONSTRAINT IF EXISTS payments_budget_quote_id_fkey,
  ADD CONSTRAINT payments_budget_quote_id_fkey 
    FOREIGN KEY (budget_quote_id) REFERENCES budget_quotes(id) ON DELETE SET NULL;