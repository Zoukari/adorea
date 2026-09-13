-- ============================================================
-- ADORÉA — MIGRATION 06 — FIX "Database error creating new user"
-- À coller dans Supabase → SQL Editor AVANT de recréer un user
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SUPPRIMER le trigger cassé de la migration 05
-- ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();

-- ────────────────────────────────────────────────────────────
-- 2. TRIGGER SÛR : ne bloque JAMAIS la création d'utilisateur
--    Si l'insert du profil échoue, on l'ignore silencieusement
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, nom, prenom, role, actif)
    VALUES (NEW.id, NEW.email, 'Admin', 'ADORÉA', 'super_admin', TRUE)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- On avale l'erreur : la création du user Auth doit réussir
    RAISE WARNING 'profil non créé pour %: %', NEW.email, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ────────────────────────────────────────────────────────────
-- 3. RATTRAPAGE manuel (à relancer après avoir créé le user)
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

-- ────────────────────────────────────────────────────────────
-- 4. VÉRIFICATION
-- ────────────────────────────────────────────────────────────
SELECT
  'Migration 06 OK — ' ||
  (SELECT COUNT(*) FROM auth.users)::TEXT || ' user(s), ' ||
  (SELECT COUNT(*) FROM public.profiles)::TEXT || ' profil(s), ' ||
  (SELECT COUNT(*) FROM public.employees)::TEXT || ' employée(s).' AS status;
