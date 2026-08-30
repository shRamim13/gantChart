-- Comments table with replies + realtime
-- Run this in Supabase Dashboard > SQL Editor

-- Add parent_comment_id for threaded replies
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Enable Realtime on comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Update RLS policies to allow threaded replies
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can add comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can add comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
