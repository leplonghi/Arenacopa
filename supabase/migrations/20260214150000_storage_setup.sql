-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-flags', 'team-flags', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for 'assets' bucket
CREATE POLICY "Public Access Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );

CREATE POLICY "Authenticated Insert Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'assets' );

CREATE POLICY "Authenticated Update Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'assets' );

-- Policies for 'avatars' bucket
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated Update Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- Policies for 'team-flags' bucket
CREATE POLICY "Public Access Team Flags"
ON storage.objects FOR SELECT
USING ( bucket_id = 'team-flags' );

CREATE POLICY "Authenticated Upload Team Flags"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'team-flags' );
