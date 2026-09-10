-- ============================================================
-- ADORÉA — MIGRATION 02 — RLS + SEED
-- Coller APRÈS la migration 01
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_health_forms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_consents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmu_records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmu_photos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_rewards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs      ENABLE ROW LEVEL SECURITY;

-- Tables publiques (lecture seule sans auth)
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links           ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings          ENABLE ROW LEVEL SECURITY;

-- ── Helper : rôle de l'utilisateur courant ──────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'manager')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'manager', 'employe', 'caisse')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ────────────────────────────────────────────────
CREATE POLICY profiles_self ON profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY profiles_admin ON profiles
  FOR ALL USING (is_admin());

-- ── EMPLOYEES ───────────────────────────────────────────────
CREATE POLICY employees_staff_read ON employees
  FOR SELECT USING (is_staff());

CREATE POLICY employees_admin_write ON employees
  FOR ALL USING (is_admin());

-- ── CATEGORIES / SERVICES (lecture publique) ────────────────
CREATE POLICY categories_public_read ON categories
  FOR SELECT USING (actif = TRUE);

CREATE POLICY categories_admin_all ON categories
  FOR ALL USING (is_admin());

CREATE POLICY services_public_read ON services
  FOR SELECT USING (actif = TRUE);

CREATE POLICY services_admin_all ON services
  FOR ALL USING (is_admin());

-- ── CLIENTS ─────────────────────────────────────────────────
-- Staff voit tous les clients
CREATE POLICY clients_staff_read ON clients
  FOR SELECT USING (is_staff());

CREATE POLICY clients_staff_insert ON clients
  FOR INSERT WITH CHECK (is_staff());

CREATE POLICY clients_admin_update ON clients
  FOR UPDATE USING (is_admin());

-- ── CLIENT HEALTH FORMS ─────────────────────────────────────
CREATE POLICY health_staff_read ON client_health_forms
  FOR SELECT USING (is_staff());

CREATE POLICY health_insert_all ON client_health_forms
  FOR INSERT WITH CHECK (TRUE);   -- le client insère via service role

CREATE POLICY health_admin_update ON client_health_forms
  FOR UPDATE USING (is_admin());

-- ── CLIENT CONSENTS ─────────────────────────────────────────
CREATE POLICY consents_staff_read ON client_consents
  FOR SELECT USING (is_staff());

CREATE POLICY consents_insert_all ON client_consents
  FOR INSERT WITH CHECK (TRUE);

-- ── APPOINTMENTS ────────────────────────────────────────────
CREATE POLICY appointments_staff ON appointments
  FOR ALL USING (is_staff());

-- Insertion publique (réservation client web) via service role
-- Lecture client via reference (token public)

-- ── PAYMENTS ────────────────────────────────────────────────
CREATE POLICY payments_staff ON payments
  FOR ALL USING (is_staff());

-- ── PMU ─────────────────────────────────────────────────────
CREATE POLICY pmu_staff ON pmu_records
  FOR ALL USING (is_staff());

CREATE POLICY pmu_photos_staff ON pmu_photos
  FOR ALL USING (is_staff());

-- Galerie publique
CREATE POLICY pmu_photos_public ON pmu_photos
  FOR SELECT USING (public_gallery = TRUE);

-- ── EXPENSES / CASH ─────────────────────────────────────────
CREATE POLICY expenses_admin ON expenses
  FOR ALL USING (is_admin());

CREATE POLICY cash_admin ON cash_closings
  FOR ALL USING (is_admin());

-- Caisse peut insérer
CREATE POLICY expenses_caisse_insert ON expenses
  FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'manager', 'caisse'));

-- ── PROMOTIONS (lecture publique) ───────────────────────────
CREATE POLICY promotions_public_read ON promotions
  FOR SELECT USING (actif = TRUE AND date_debut <= CURRENT_DATE AND date_fin >= CURRENT_DATE);

CREATE POLICY promotions_admin ON promotions
  FOR ALL USING (is_admin());

-- ── SOCIAL LINKS / SETTINGS (lecture publique) ──────────────
CREATE POLICY social_public ON social_links
  FOR SELECT USING (actif = TRUE);

CREATE POLICY social_admin ON social_links
  FOR ALL USING (is_admin());

CREATE POLICY settings_public ON site_settings
  FOR SELECT USING (TRUE);

CREATE POLICY settings_admin ON site_settings
  FOR ALL USING (is_admin());

-- ── AUDIT ───────────────────────────────────────────────────
CREATE POLICY audit_admin ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY audit_insert ON audit_logs
  FOR INSERT WITH CHECK (is_staff());

-- ── LOYALTY ─────────────────────────────────────────────────
CREATE POLICY rewards_staff ON client_rewards
  FOR ALL USING (is_staff());

-- ── NOTIFICATIONS ───────────────────────────────────────────
CREATE POLICY notif_staff ON notification_logs
  FOR ALL USING (is_staff());


-- ============================================================
-- SEED — DONNÉES INITIALES
-- ============================================================

-- ── Site settings par défaut ────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('wa_enabled',           'true'),
  ('wa_numero_principal',  '+25377596159'),
  ('wa_paiements',         'true'),
  ('wa_validation_sante',  'true'),
  ('wa_rappels',           'true'),
  ('wa_bouton_flottant',   'true'),
  ('wa_reservation',       'true'),
  ('wa_retouches',         'true'),
  ('wa_fidelite',          'true'),
  ('delai_min_resa_heures','2'),
  ('delai_max_resa_jours', '60'),
  ('buffer_defaut_minutes','10'),
  ('adresse',              'PK13 – Bâtiment B1-2, Djibouti Ville'),
  ('telephone',            '+253 77 59 61 59'),
  ('email',                'adlina@adorea-dj.com'),
  ('horaires',             'Lun – Sam · 09h – 19h'),
  ('maps_lat',             '11.5720'),
  ('maps_lng',             '43.1456'),
  ('maps_url',             'https://maps.google.com/?q=Djibouti'),
  ('instagram_url',        ''),
  ('tiktok_url',           ''),
  ('facebook_url',         '')
ON CONFLICT (key) DO NOTHING;

-- ── Réseaux sociaux ─────────────────────────────────────────
INSERT INTO social_links (reseau, url, icone, actif, ordre) VALUES
  ('instagram', '', 'instagram', FALSE, 1),
  ('tiktok',    '', 'tiktok',    FALSE, 2),
  ('facebook',  '', 'facebook',  FALSE, 3),
  ('whatsapp',  'https://wa.me/25377596159', 'whatsapp', TRUE, 4)
ON CONFLICT DO NOTHING;

-- ── Catégories ───────────────────────────────────────────────
INSERT INTO categories (id, slug, nom_fr, nom_en, nom_ar, desc_fr, desc_en, desc_ar, actif, ordre) VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'sourcils-pmu',
    'Sourcils PMU',
    'Brows PMU',
    'حواجب PMU',
    'Powder Brows et Combo Brows pour des sourcils naturels et durables. Technique belge certifiée.',
    'Powder Brows and Combo Brows for natural, long-lasting results. Belgian certified technique.',
    'باودر براوز وكومبو براوز لحواجب طبيعية وطويلة الأمد. تقنية بلجيكية معتمدة.',
    TRUE, 1
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'levres-pmu',
    'Lèvres PMU',
    'Lips PMU',
    'شفاه PMU',
    'Candy Lips et neutralisation pour des lèvres définies et éclatantes.',
    'Candy Lips and neutralisation for defined, radiant lips.',
    'كاندي ليبس وتحييد الشفاه الداكنة لشفاه محددة ومشرقة.',
    TRUE, 2
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'makeup-pro',
    'Makeup Pro',
    'Pro Makeup',
    'ميكاب احترافي',
    'Du maquillage jour au grand événement, chaque regard sculpté avec précision.',
    'From everyday looks to grand events, sculpted with precision.',
    'من ميكاب اليوم إلى المناسبات الكبرى، كل إطلالة تُنحت بدقة.',
    TRUE, 3
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'nails',
    'Nails',
    'Nails',
    'أظافر',
    'Manucure classique, semi-permanent et Nail Art.',
    'Classic manicure, semi-permanent and Nail Art.',
    'مانيكير كلاسيك، شبه دائم وناي آرت.',
    TRUE, 4
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Services — Sourcils PMU ──────────────────────────────────
INSERT INTO services (id, category_id, slug, nom_fr, nom_en, nom_ar, prix, duree_minutes, buffer_minutes, is_pmu, retouche_delai_min_jours, retouche_delai_max_jours, actif, ordre) VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'powder-brows',
    'Powder Brows', 'Powder Brows', 'باودر براوز',
    55000, 120, 15, TRUE, 25, 455, TRUE, 1
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'combo-brows',
    'Combo Brows', 'Combo Brows', 'كومبو براوز',
    60000, 150, 15, TRUE, 25, 455, TRUE, 2
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'retouche-1-mois-sourcils',
    'Retouche 1 mois', '1-month Touch-up', 'ريتوش شهر',
    15000, 60, 10, TRUE, NULL, NULL, TRUE, 3
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'retouche-annuelle-sourcils',
    'Retouche annuelle (9–15 mois)', 'Annual touch-up (9–15m)', 'ريتوش سنوي',
    30000, 90, 10, TRUE, 270, 455, TRUE, 4
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Services — Lèvres PMU ────────────────────────────────────
INSERT INTO services (id, category_id, slug, nom_fr, nom_en, nom_ar, prix, prix_sur_devis, duree_minutes, buffer_minutes, is_pmu, actif, ordre) VALUES
  (
    'b2000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'candy-lips',
    'Candy Lips', 'Candy Lips', 'كاندي ليبس',
    60000, FALSE, 150, 15, TRUE, TRUE, 1
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000002',
    'neutralisation-levres',
    'Neutralisation lèvres foncées', 'Dark Lips Neutralisation', 'تحييد الشفاه الداكنة',
    0, TRUE, 120, 15, TRUE, TRUE, 2
  ),
  (
    'b2000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000002',
    'retouche-annuelle-levres',
    'Retouche annuelle (9–15 mois)', 'Annual touch-up lips', 'ريتوش سنوي شفاه',
    30000, FALSE, 90, 10, TRUE, TRUE, 3
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Services — Makeup Pro ────────────────────────────────────
INSERT INTO services (id, category_id, slug, nom_fr, nom_en, nom_ar, prix, prix_sur_devis, duree_minutes, buffer_minutes, actif, ordre) VALUES
  (
    'b3000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000003',
    'makeup-jour',
    'Makeup Jour', 'Day Makeup', 'ميكاب يومي',
    5000, FALSE, 60, 10, TRUE, 1
  ),
  (
    'b3000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'makeup-soiree',
    'Makeup Soirée', 'Evening Makeup', 'ميكاب سهرة',
    6500, FALSE, 75, 10, TRUE, 2
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000003',
    'makeup-mariee',
    'Makeup Mariée', 'Bridal Makeup', 'ميكاب عروس',
    13000, FALSE, 120, 15, TRUE, 3
  ),
  (
    'b3000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000003',
    'essai-mariee',
    'Essai Mariée', 'Bridal Trial', 'تجربة عروس',
    6500, FALSE, 90, 10, TRUE, 4
  ),
  (
    'b3000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000003',
    'shooting-event',
    'Shooting / Event', 'Shooting / Event', 'تصوير / فعالية',
    0, TRUE, 120, 15, TRUE, 5
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Services — Nails ─────────────────────────────────────────
INSERT INTO services (id, category_id, slug, nom_fr, nom_en, nom_ar, prix, duree_minutes, buffer_minutes, actif, ordre) VALUES
  (
    'b4000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000004',
    'manucure-classique',
    'Manucure classique', 'Classic Manicure', 'مانيكير كلاسيك',
    4000, 45, 10, TRUE, 1
  ),
  (
    'b4000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000004',
    'semi-permanent',
    'Semi-Permanent', 'Semi-Permanent', 'شبه دائم',
    8000, 75, 10, TRUE, 2
  ),
  (
    'b4000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'semi-permanent-french',
    'Semi-Permanent French', 'Semi-Permanent French', 'شبه دائم فرنش',
    10000, 90, 10, TRUE, 3
  ),
  (
    'b4000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000004',
    'pedicure-simple',
    'Pédicure simple', 'Simple Pedicure', 'باديكير بسيط',
    7000, 60, 10, TRUE, 4
  ),
  (
    'b4000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000004',
    'pedicure-semi-permanent',
    'Pédicure semi-permanent', 'Semi-Permanent Pedicure', 'باديكير شبه دائم',
    12000, 75, 10, TRUE, 5
  ),
  (
    'b4000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000004',
    'nail-art',
    'Nail Art', 'Nail Art', 'ناي آرت',
    1000, 30, 5, TRUE, 6
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Règle fidélité par défaut ────────────────────────────────
INSERT INTO loyalty_rules (nom, condition_type, condition_valeur, operateur, reward_type, reward_valeur, validite_jours, actif) VALUES
  ('5 prestations = -20%', 'nb_prestations', 5, 'ET', 'reduction_pct', 20, 90, TRUE)
ON CONFLICT DO NOTHING;

SELECT 'Migration 02 OK — RLS + Seed chargés.' AS status;
