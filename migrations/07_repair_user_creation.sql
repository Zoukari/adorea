-- ============================================================
-- ADORÉA — MIGRATION 07 — RÉPARATION TOTALE CRÉATION USER
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ÉTAPE 1 : VOIR TOUS LES TRIGGERS SUR auth.users
-- (lance d'abord ça seul pour voir ce qui existe)
-- ────────────────────────────────────────────────────────────
SELECT tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;

-- ────────────────────────────────────────────────────────────
-- ÉTAPE 2 : SUPPRIMER TOUS LES TRIGGERS PERSONNALISÉS
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='auth' AND c.relname='users' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', r.tgname);
    RAISE NOTICE 'Trigger supprimé : %', r.tgname;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ────────────────────────────────────────────────────────────
-- ÉTAPE 3 : RENDRE profiles TOLÉRANT
-- (colonnes nullables + valeurs par défaut)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ALTER COLUMN nom    DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN prenom DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN nom    SET DEFAULT 'Admin';
ALTER TABLE public.profiles ALTER COLUMN prenom SET DEFAULT 'ADORÉA';
ALTER TABLE public.profiles ALTER COLUMN role   SET DEFAULT 'super_admin';
ALTER TABLE public.profiles ALTER COLUMN actif  SET DEFAULT TRUE;

-- Même chose sur employees
ALTER TABLE public.employees ALTER COLUMN nom    DROP NOT NULL;
ALTER TABLE public.employees ALTER COLUMN prenom DROP NOT NULL;

-- ────────────────────────────────────────────────────────────
-- ÉTAPE 4 : DONNER LES DROITS AU RÔLE SUPABASE AUTH
-- (c'est souvent LA cause du "Database error creating new user")
-- ────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, service_role;

-- ────────────────────────────────────────────────────────────
-- ✅ MAINTENANT : crée ton utilisateur dans Supabase → Auth
--    (coche "Auto confirm user")
--    PUIS lance l'étape 5 ci-dessous
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- ÉTAPE 5 : RATTRAPAGE (à lancer APRÈS création du user)
-- ────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, nom, prenom, role, actif)
SELECT u.id, u.email, 'Admin', 'ADORÉA', 'super_admin', TRUE
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET role = 'super_admin', actif = TRUE
WHERE id IN (SELECT id FROM auth.users);

INSERT INTO public.employees (nom, prenom, email, role, actif, profile_id)
SELECT p.nom, p.prenom, p.email, 'super_admin', TRUE, p.id
FROM public.profiles p
LEFT JOIN public.employees e ON e.profile_id = p.id
WHERE e.id IS NULL
ON CONFLICT DO NOTHING;

SELECT
  'OK — ' ||
  (SELECT COUNT(*) FROM auth.users)::TEXT || ' user(s), ' ||
  (SELECT COUNT(*) FROM public.profiles)::TEXT || ' profil(s), ' ||
  (SELECT COUNT(*) FROM public.employees)::TEXT || ' employée(s).' AS status;
