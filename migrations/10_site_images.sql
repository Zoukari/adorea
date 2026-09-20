-- ═══════════════════════════════════════════════════════
-- IMAGES DU SITE VITRINE — pilotées depuis l'admin
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot        TEXT NOT NULL UNIQUE,   -- identifiant de l'emplacement
  url         TEXT NOT NULL,
  label       TEXT,                   -- légende (galerie)
  tag         TEXT,                   -- sur-titre (galerie)
  position    TEXT DEFAULT 'center',  -- object-position CSS
  ordre       INTEGER NOT NULL DEFAULT 0,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON public.site_images TO anon, authenticated, service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_images_auth_all ON public.site_images;
CREATE POLICY site_images_auth_all ON public.site_images
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS site_images_anon_read ON public.site_images;
CREATE POLICY site_images_anon_read ON public.site_images
  FOR SELECT TO anon USING (TRUE);

-- Emplacements par défaut, pointant vers les images actuelles
INSERT INTO public.site_images (slot, url, label, tag, position, ordre) VALUES
  ('hero',          '/images/hero-main.webp',       'Accueil',        'STUDIO',      'center 20%', 1),
  ('brand',         '/images/brand-beige.webp',     'Notre maison',   'BRAND',       'center 30%', 2),
  ('svc_sourcils',  '/images/pmu-brows.webp',       'Sourcils PMU',   'PMU',         'center 30%', 3),
  ('svc_levres',    '/images/levres-closeup.webp',  'Lèvres PMU',     'PMU',         'center 35%', 4),
  ('svc_makeup',    '/images/makeup-profile.webp',  'Makeup Pro',     'MAKEUP',      'center 25%', 5),
  ('svc_nails',     '/images/nails-hero.webp',      'Nails',          'NAILS',       'center 40%', 6),
  ('gal_1',         '/images/gallery-makeup.webp',  'Pour vos grands moments',      'MAKEUP PRO',  'center 60%', 7),
  ('gal_2',         '/images/gallery-levres.webp',  'Des lèvres sublimées',         'LÈVRES PMU',  'top', 8),
  ('gal_3',         '/images/gallery-nails.webp',   'Élégance au bout des ongles',  'NAILS',       'top', 9),
  ('gal_4',         '/images/gallery-sourcils.webp','Précision & savoir-faire',     'SOURCILS PMU','top', 10),
  ('gal_5',         '/images/hero-main.webp',       'ADORÉA Djibouti',              'STUDIO',      'top', 11),
  ('ba_before_1',   '/images/ba-before-1.webp',     'Sourcils — avant',  'AVANT', 'center', 12),
  ('ba_after_1',    '/images/ba-after-1.webp',      'Sourcils — après',  'APRÈS', 'center', 13),
  ('ba_before_2',   '/images/ba-after-2.webp',      'Lèvres — avant',    'AVANT', 'center', 14),
  ('ba_after_2',    '/images/ba-before-2.webp',     'Lèvres — après',    'APRÈS', 'center', 15)
ON CONFLICT (slot) DO NOTHING;

SELECT 'Migration 10 OK — ' || COUNT(*)::TEXT || ' emplacements.' AS status
FROM public.site_images;
