CREATE TABLE material_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  material_name text NOT NULL,
  unit text NOT NULL,
  index_per_m2 numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE material_indices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view material_indices" ON material_indices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert material_indices" ON material_indices
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update material_indices" ON material_indices
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete material_indices" ON material_indices
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO material_indices (activity_type, material_name, unit, index_per_m2) VALUES
('alvenaria','Tijolo 29x19x9','un',17.5),
('alvenaria','Argamassa de assentamento','kg',7.2),
('alvenaria','Cimento CP-II','kg',5.8),
('reboco','Argamassa de reboco','kg',16),
('piso','Cola para piso','kg',4.5),
('piso','Rejunte','kg',0.3),
('pintura','Tinta látex (1ª demão)','L',0.18),
('pintura','Tinta látex (2ª demão)','L',0.14),
('pintura','Massa corrida','kg',0.5);