-- ============================================================
-- ADORÉA — MIGRATION 05 — FIX ACCÈS ADMIN
-- À coller dans Supabase → SQL Editor
-- Répare : pages admin vides (RLS bloque car profil manquant)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TRIGGER : créer automatiquement un profil à chaque
--    nouvel utilisateur Supabase Auth
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nom, prenom, role, actif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'ADORÉA'),
    'super_admin',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ────────────────────────────────────────────────────────────
-- 2. RATTRAPAGE : créer un profil super_admin pour TOUS les
--    utilisateurs auth existants qui n'en ont pas
-- ────────────────────────────────────────────────────────────
INSERT INTO profiles (id, email, nom, prenom, role, actif)
SELECT
  u.id,
  u.email,
  'Admin',
  'ADORÉA',
  'super_admin',
  TRUE
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Forcer super_admin + actif sur tous les profils existants
-- (à ajuster plus tard quand tu ajouteras des employées)
UPDATE profiles SET role = 'super_admin', actif = TRUE
WHERE id IN (SELECT id FROM auth.users);

-- ────────────────────────────────────────────────────────────
-- 3. CRÉER LES EMPLOYEES LIÉS MANQUANTS
-- ────────────────────────────────────────────────────────────
INSERT INTO employees (nom, prenom, email, role, actif, profile_id)
SELECT p.nom, p.prenom, p.email, 'super_admin', TRUE, p.id
FROM profiles p
LEFT JOIN employees e ON e.profile_id = p.id
WHERE e.id IS NULL
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 4. POLICIES DE SECOURS — lecture pour tout utilisateur
--    authentifié (évite le blocage total si get_my_role() rate)
-- ────────────────────────────────────────────────────────────

-- profiles : un user peut toujours lire sa propre ligne
DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Services / catégories : lecture publique (landing + admin)
DROP POLICY IF EXISTS services_public_read ON services;
CREATE POLICY services_public_read ON services
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS categories_public_read ON categories;
CREATE POLICY categories_public_read ON categories
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS site_settings_public_read ON site_settings;
CREATE POLICY site_settings_public_read ON site_settings
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS social_links_public_read ON social_links;
CREATE POLICY social_links_public_read ON social_links
  FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS promotions_public_read ON promotions;
CREATE POLICY promotions_public_read ON promotions
  FOR SELECT TO anon, authenticated USING (TRUE);

-- ────────────────────────────────────────────────────────────
-- 5. ACCÈS COMPLET POUR LES UTILISATEURS AUTHENTIFIÉS
--    (staff ADORÉA — toutes les tables métier)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'employees','clients','client_health_forms','client_consents',
    'appointments','payments','pmu_records','pmu_photos',
    'expenses','cash_closings','client_rewards','notification_logs',
    'services','categories','promotions','site_settings','social_links'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Supprimer la policy si elle existe déjà
    EXECUTE format('DROP POLICY IF EXISTS %I_auth_all ON %I', t, t);
    -- Créer une policy ALL pour les utilisateurs authentifiés
    EXECUTE format(
      'CREATE POLICY %I_auth_all ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)',
      t, t
    );
  END LOOP;
END $$;

-- Tables optionnelles (ignorées si absentes)
DO $$
DECLARE
  t TEXT;
  opt_tables TEXT[] := ARRAY[
    'promo_codes','employee_services','employee_schedules',
    'schedule_slots','gallery_items','loyalty_rules','appointment_services'
  ];
BEGIN
  FOREACH t IN ARRAY opt_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I_auth_all ON %I', t, t);
      EXECUTE format(
        'CREATE POLICY %I_auth_all ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)',
        t, t
      );
      -- Lecture publique pour les tables affichées sur la landing
      IF t IN ('promo_codes','gallery_items','employee_services') THEN
        EXECUTE format('DROP POLICY IF EXISTS %I_public_read ON %I', t, t);
        EXECUTE format(
          'CREATE POLICY %I_public_read ON %I FOR SELECT TO anon USING (TRUE)', t, t
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 6. VÉRIFICATION
-- ────────────────────────────────────────────────────────────
SELECT
  'Migration 05 OK — ' ||
  (SELECT COUNT(*) FROM auth.users)::TEXT || ' user(s) auth, ' ||
  (SELECT COUNT(*) FROM profiles)::TEXT || ' profil(s), ' ||
  (SELECT COUNT(*) FROM employees)::TEXT || ' employée(s), ' ||
  (SELECT COUNT(*) FROM services)::TEXT || ' prestation(s).' AS status;
