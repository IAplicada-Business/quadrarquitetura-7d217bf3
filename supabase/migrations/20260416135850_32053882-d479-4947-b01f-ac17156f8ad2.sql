
DROP POLICY "Users can view own clients" ON clients;
DROP POLICY "Users can update own clients" ON clients;
DROP POLICY "Users can delete own clients" ON clients;
DROP POLICY "Users can create clients" ON clients;

CREATE POLICY "Team can view clients" ON clients FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Team can update clients" ON clients FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Team can delete clients" ON clients FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Team can create clients" ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);
