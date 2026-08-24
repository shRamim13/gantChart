-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read/write
CREATE POLICY "Users can view attachments" ON task_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload attachments" ON task_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  52428800,
  ARRAY[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-attachments' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-attachments' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]
  );
