
CREATE TABLE labor_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline text NOT NULL,
  activity_type text,
  cost_per_m2 numeric,
  cost_per_unit numeric,
  unit text DEFAULT 'm2',
  region text DEFAULT 'Belo Horizonte',
  notes text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE labor_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view labor_costs" ON labor_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert labor_costs" ON labor_costs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update labor_costs" ON labor_costs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete labor_costs" ON labor_costs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO labor_costs (discipline, activity_type, cost_per_m2, unit) VALUES
('Elétrica', 'eletrica', 45, 'm2'),
('Pintura', 'pintura', 18, 'm2'),
('Alvenaria', 'alvenaria', 55, 'm2'),
('Piso', 'piso', 35, 'm2'),
('Reboco', 'reboco', 30, 'm2'),
('Hidráulica', 'hidraulica', 50, 'm2'),
('Gesso/Forro', 'gesso', 40, 'm2');
