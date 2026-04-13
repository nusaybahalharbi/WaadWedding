-- ============================================================
-- Wedding Photo Upload System - Supabase Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  guest_name TEXT DEFAULT 'ضيف كريم',
  ip_address TEXT,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert default settings
INSERT INTO settings (key, value) VALUES ('uploads_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: DENY ALL public access
-- The anon key should have NO access to uploads table
-- Only the service_role key (used server-side) can read/write

-- Allow anon to read settings (to check if uploads are open)
CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (true);

-- Deny all other access via anon key
-- (No INSERT, UPDATE, DELETE policies for anon on uploads means they can't do anything)
-- (No policies for anon on uploads SELECT means they can't list files)

-- Service role bypasses RLS by default, so admin operations work

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_reviewed ON uploads (reviewed);

-- ============================================================
-- IMPORTANT: Storage bucket setup (do this in Supabase Dashboard)
-- 
-- 1. Go to Storage > Create bucket
-- 2. Name: "wedding-uploads"  
-- 3. Public bucket: OFF (CRITICAL - must be private!)
-- 4. File size limit: 52428800 (50MB)
-- 5. Allowed MIME types: image/jpeg,image/png,image/heic,image/heif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/3gpp
--
-- Storage policies:
-- DO NOT create any public access policies
-- The service_role key bypasses storage policies
-- This means ONLY server-side code can upload/download/delete
-- ============================================================
