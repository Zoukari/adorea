-- ============================================================
-- ADORÉA — MIGRATION 04 — STORAGE BUCKETS
-- Coller APRÈS migration 03
-- ============================================================

-- Bucket photos PMU (avant/après)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pmu-photos',
  'pmu-photos',
  TRUE,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket avatars employées
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-avatars',
  'employee-avatars',
  TRUE,
  2097152, -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket reçus dépenses (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  FALSE,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS Storage ──────────────────────────────────────────────

-- Photos PMU : lecture publique, upload uniquement staff
CREATE POLICY "pmu_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pmu-photos');

CREATE POLICY "pmu_photos_staff_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pmu-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "pmu_photos_staff_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pmu-photos'
    AND auth.role() = 'authenticated'
  );

-- Avatars : lecture publique
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'employee-avatars');

CREATE POLICY "avatars_staff_write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'employee-avatars'
    AND auth.role() = 'authenticated'
  );

-- Reçus : staff uniquement
CREATE POLICY "receipts_staff" ON storage.objects
  FOR ALL USING (
    bucket_id = 'expense-receipts'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- PREMIER COMPTE SUPER ADMIN
-- Remplacer l'email par le tien AVANT d'exécuter
-- ============================================================

-- ÉTAPE 1 : Créer le user dans Auth via Supabase Dashboard
-- Authentication → Users → Add user
-- Email : adlina@adorea-dj.com
-- Password : (choisir un mot de passe fort)

-- ÉTAPE 2 : Exécuter ce SQL APRÈS avoir créé le user
-- (remplacer l'email si différent)

INSERT INTO profiles (id, email, nom, prenom, role, actif)
SELECT
  id,
  email,
  'Adlina',
  'Admin',
  'super_admin',
  TRUE
FROM auth.users
WHERE email = 'adlina@adorea-dj.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', actif = TRUE;

-- Créer l'entrée employee liée
INSERT INTO employees (nom, prenom, email, role, actif, profile_id)
SELECT 'Adlina', 'Admin', 'adlina@adorea-dj.com', 'super_admin', TRUE, id
FROM auth.users WHERE email = 'adlina@adorea-dj.com'
ON CONFLICT DO NOTHING;

SELECT 'Migration 04 OK — Storage + Super Admin configurés.' AS status;
