-- Allow authenticated users to update invitation status (for self-accept)
DROP POLICY IF EXISTS "Users can accept own invitation" ON invitations;
CREATE POLICY "Users can accept own invitation" ON invitations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to read invitations (for admin panel)
DROP POLICY IF EXISTS "Users can view invitations" ON invitations;
CREATE POLICY "Users can view invitations" ON invitations
  FOR SELECT USING (auth.role() = 'authenticated');
