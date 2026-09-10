-- ============================================================
-- ADORÉA — MIGRATION 01 — TABLES DE BASE
-- Coller dans : Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- recherche texte rapide

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'manager', 'employe', 'caisse');
CREATE TYPE appointment_status AS ENUM (
  'creee', 'paiement_attendu', 'paiement_envoye', 'a_valider',
  'confirmee', 'cliente_arrivee', 'en_cours', 'terminee',
  'annulee', 'absente', 'refusee'
);
CREATE TYPE payment_method AS ENUM ('cac_pay', 'waafi', 'd_money', 'cash');
CREATE TYPE payment_status AS ENUM ('en_attente', 'valide', 'rembourse', 'echoue');
CREATE TYPE lang_code AS ENUM ('fr', 'en', 'ar');
CREATE TYPE reward_type AS ENUM ('reduction_pct', 'reduction_fixe', 'bon', 'prestation_offerte');
CREATE TYPE loyalty_condition_type AS ENUM ('nb_prestations', 'montant_depense', 'categorie', 'prestation', 'anniversaire', 'premiere_visite');
CREATE TYPE absence_type AS ENUM ('conge', 'absence', 'indisponibilite', 'rdv_perso', 'journee_bloquee');
CREATE TYPE expense_category AS ENUM (
  'pigments', 'makeup', 'nails', 'consommables', 'hygiene',
  'materiel', 'mobilier', 'marketing', 'transport', 'autre'
);

-- ============================================================
-- PROFILES (lié à Supabase Auth)
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  nom           TEXT,
  prenom        TEXT,
  telephone     TEXT,
  photo_url     TEXT,
  role          user_role NOT NULL DEFAULT 'employe',
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================

CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  email           TEXT UNIQUE,
  telephone       TEXT,
  photo_url       TEXT,
  role            user_role NOT NULL DEFAULT 'employe',
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  commission_on   BOOLEAN NOT NULL DEFAULT FALSE,
  commission_pct  NUMERIC(5,2),          -- % si mode %
  commission_fixe NUMERIC(10,2),         -- montant fixe si mode fixe
  notes_internes  TEXT,
  whatsapp_number TEXT,                  -- numéro WA perso optionnel
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE NOT NULL,
  nom_fr      TEXT NOT NULL,
  nom_en      TEXT,
  nom_ar      TEXT,
  desc_fr     TEXT,
  desc_en     TEXT,
  desc_ar     TEXT,
  image_url   TEXT,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  ordre       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICES (prestations)
-- ============================================================

CREATE TABLE services (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id             UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug                    TEXT UNIQUE NOT NULL,
  nom_fr                  TEXT NOT NULL,
  nom_en                  TEXT,
  nom_ar                  TEXT,
  desc_fr                 TEXT,
  desc_en                 TEXT,
  desc_ar                 TEXT,
  prix                    NUMERIC(10,2) NOT NULL DEFAULT 0,
  prix_sur_devis          BOOLEAN NOT NULL DEFAULT FALSE,
  duree_minutes           INTEGER NOT NULL DEFAULT 60,
  buffer_minutes          INTEGER NOT NULL DEFAULT 10,
  image_url               TEXT,
  actif                   BOOLEAN NOT NULL DEFAULT TRUE,
  ordre                   INTEGER NOT NULL DEFAULT 0,
  is_pmu                  BOOLEAN NOT NULL DEFAULT FALSE,   -- Powder Brows / Candy Lips
  retouche_delai_min_jours INTEGER,                         -- délai min retouche (ex: 30j)
  retouche_delai_max_jours INTEGER,                         -- délai max retouche annuelle
  whatsapp_validation_number TEXT,                          -- WA spécifique santé
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEE <-> SERVICE (autorisations)
-- ============================================================

CREATE TABLE employee_services (
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (employee_id, service_id)
);

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE TABLE clients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                 TEXT NOT NULL,
  prenom              TEXT NOT NULL,
  date_naissance      DATE,
  telephone           TEXT UNIQUE NOT NULL,
  email               TEXT,
  notes_internes      TEXT,
  total_prestations   INTEGER NOT NULL DEFAULT 0,   -- compteur mis à jour par trigger
  total_depense       NUMERIC(10,2) NOT NULL DEFAULT 0,
  derniere_visite     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENT HEALTH FORMS
-- ============================================================

CREATE TABLE client_health_forms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  UUID,                             -- lié au RDV (FK ajoutée après)
  grossesse       BOOLEAN NOT NULL DEFAULT FALSE,
  diabete         BOOLEAN NOT NULL DEFAULT FALSE,
  allergies       BOOLEAN NOT NULL DEFAULT FALSE,
  traitement_med  BOOLEAN NOT NULL DEFAULT FALSE,
  pb_peau         BOOLEAN NOT NULL DEFAULT FALSE,
  herpes          BOOLEAN NOT NULL DEFAULT FALSE,
  anticoagulants  BOOLEAN NOT NULL DEFAULT FALSE,
  commentaires    TEXT,
  has_contraindication BOOLEAN GENERATED ALWAYS AS (
    grossesse OR diabete OR allergies OR traitement_med
    OR pb_peau OR herpes OR anticoagulants
  ) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENT CONSENTS
-- ============================================================

CREATE TABLE client_consents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  UUID,
  consent_text    TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  signature_data  TEXT,                             -- base64 SVG signature
  ip_address      INET,
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEE SCHEDULES (planning jour par jour)
-- ============================================================

CREATE TABLE employee_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date_jour     DATE NOT NULL,
  heure_debut   TIME,
  heure_fin     TIME,
  est_disponible BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  UNIQUE (employee_id, date_jour, heure_debut)
);

-- Plages multiples par jour (matin / après-midi)
CREATE TABLE schedule_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id     UUID NOT NULL REFERENCES employee_schedules(id) ON DELETE CASCADE,
  heure_debut     TIME NOT NULL,
  heure_fin       TIME NOT NULL
);

-- ============================================================
-- EMPLOYEE ABSENCES
-- ============================================================

CREATE TABLE employee_absences (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type_absence  absence_type NOT NULL DEFAULT 'absence',
  date_debut    DATE NOT NULL,
  date_fin      DATE NOT NULL,
  motif         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  employee_id       UUID REFERENCES employees(id) ON DELETE SET NULL,
  date_rdv          DATE NOT NULL,
  heure_debut       TIME NOT NULL,
  heure_fin         TIME NOT NULL,
  statut            appointment_status NOT NULL DEFAULT 'creee',
  prix_final        NUMERIC(10,2) NOT NULL,
  remise_pct        NUMERIC(5,2),
  remise_fixe       NUMERIC(10,2),
  code_promo_id     UUID,                           -- FK ajoutée après
  payment_method    payment_method,
  payment_status    payment_status NOT NULL DEFAULT 'en_attente',
  notes_admin       TEXT,
  reference         TEXT UNIQUE NOT NULL DEFAULT 'ADR-' || UPPER(SUBSTR(uuid_generate_v4()::TEXT, 1, 8)),
  health_validated  BOOLEAN,                         -- NULL = pas encore traité
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL = client web
  is_walkin         BOOLEAN NOT NULL DEFAULT FALSE,  -- caisse directe
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENT STATUS HISTORY
-- ============================================================

CREATE TABLE appointment_status_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  statut          appointment_status NOT NULL,
  changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note            TEXT,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  montant         NUMERIC(10,2) NOT NULL,
  methode         payment_method NOT NULL,
  statut          payment_status NOT NULL DEFAULT 'en_attente',
  reference_ext   TEXT,                             -- ref CAC PAY / WAAFI / D-MONEY
  screenshot_url  TEXT,                             -- preuve paiement
  validated_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROMOTIONS
-- ============================================================

CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id      UUID REFERENCES services(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE CASCADE,
  nom             TEXT NOT NULL,
  remise_pct      NUMERIC(5,2),
  remise_fixe     NUMERIC(10,2),
  date_debut      DATE NOT NULL,
  date_fin        DATE NOT NULL,
  nb_utilisations_max INTEGER,
  nb_utilisations_actuel INTEGER NOT NULL DEFAULT 0,
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROMO CODES
-- ============================================================

CREATE TABLE promo_codes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT UNIQUE NOT NULL,
  remise_pct          NUMERIC(5,2),
  remise_fixe         NUMERIC(10,2),
  montant_min         NUMERIC(10,2),
  service_id          UUID REFERENCES services(id) ON DELETE SET NULL,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  date_debut          DATE,
  date_fin            DATE,
  nb_utilisations_max INTEGER,
  nb_utilisations_actuel INTEGER NOT NULL DEFAULT 0,
  nb_par_cliente_max  INTEGER,
  actif               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promo_code_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_id    UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter FK manquante sur appointments
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_promo
  FOREIGN KEY (code_promo_id) REFERENCES promo_codes(id) ON DELETE SET NULL;

-- ============================================================
-- LOYALTY RULES
-- ============================================================

CREATE TABLE loyalty_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom             TEXT NOT NULL,
  condition_type  loyalty_condition_type NOT NULL,
  condition_valeur NUMERIC(10,2),                  -- ex: 5 (prestations) ou 50000 (FDJ)
  condition_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  condition_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  operateur       TEXT NOT NULL DEFAULT 'ET',       -- ET / OU
  reward_type     reward_type NOT NULL,
  reward_valeur   NUMERIC(10,2),
  reward_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  validite_jours  INTEGER,                          -- null = illimité
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE client_rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rule_id         UUID NOT NULL REFERENCES loyalty_rules(id) ON DELETE CASCADE,
  reward_type     reward_type NOT NULL,
  reward_valeur   NUMERIC(10,2),
  code_bon        TEXT UNIQUE,                      -- code bon unique
  expire_at       TIMESTAMPTZ,
  utilise         BOOLEAN NOT NULL DEFAULT FALSE,
  utilise_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PMU RECORDS
-- ============================================================

CREATE TABLE pmu_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  pigment         TEXT,
  technique       TEXT,
  notes           TEXT,
  prochaine_retouche_avant DATE,
  prochaine_retouche_apres DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pmu_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id   UUID NOT NULL REFERENCES pmu_records(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('avant', 'apres')),
  public_gallery BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES (dépenses)
-- ============================================================

CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_depense    DATE NOT NULL,
  produit         TEXT NOT NULL,
  categorie       expense_category NOT NULL DEFAULT 'autre',
  quantite        NUMERIC(10,2) NOT NULL DEFAULT 1,
  montant         NUMERIC(10,2) NOT NULL,
  marque          TEXT,
  fournisseur     TEXT,
  photo_recu_url  TEXT,
  notes           TEXT,
  saisi_par       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CASH CLOSINGS (clôtures de caisse)
-- ============================================================

CREATE TABLE cash_closings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_cloture    DATE UNIQUE NOT NULL,
  cash_theorique  NUMERIC(10,2) NOT NULL,
  cash_reel       NUMERIC(10,2) NOT NULL,
  ecart           NUMERIC(10,2) GENERATED ALWAYS AS (cash_reel - cash_theorique) STORED,
  commentaire     TEXT,
  ferme_par       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SITE SETTINGS
-- ============================================================

CREATE TABLE site_settings (
  key     TEXT PRIMARY KEY,
  value   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SOCIAL LINKS
-- ============================================================

CREATE TABLE social_links (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseau    TEXT NOT NULL,   -- instagram, tiktok, facebook...
  url       TEXT NOT NULL,
  icone     TEXT,
  actif     BOOLEAN NOT NULL DEFAULT TRUE,
  ordre     INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================

CREATE TABLE notification_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT NOT NULL,   -- whatsapp_rappel, whatsapp_retouche...
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  numero          TEXT,
  message         TEXT,
  statut          TEXT NOT NULL DEFAULT 'envoye',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  table_name    TEXT NOT NULL,
  record_id     UUID,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FK MANQUANTES (circular deps résolues après création)
-- ============================================================

ALTER TABLE client_health_forms
  ADD CONSTRAINT fk_health_appointment
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

ALTER TABLE client_consents
  ADD CONSTRAINT fk_consent_appointment
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES PERFORMANCE
-- ============================================================

CREATE INDEX idx_appointments_date ON appointments(date_rdv);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_employee ON appointments(employee_id);
CREATE INDEX idx_appointments_statut ON appointments(statut);
CREATE INDEX idx_clients_telephone ON clients(telephone);
CREATE INDEX idx_clients_nom_prenom ON clients USING gin((nom || ' ' || prenom) gin_trgm_ops);
CREATE INDEX idx_employee_schedules_date ON employee_schedules(date_jour, employee_id);
CREATE INDEX idx_pmu_records_client ON pmu_records(client_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);

-- ============================================================
-- TRIGGERS — updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pmu_records_updated_at
  BEFORE UPDATE ON pmu_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER — Historique statuts RDV automatique
-- ============================================================

CREATE OR REPLACE FUNCTION log_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO appointment_status_history(appointment_id, statut, changed_by)
    VALUES (NEW.id, NEW.statut, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointment_status_history
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_status();

-- ============================================================
-- TRIGGER — Mise à jour stats client après RDV terminé
-- ============================================================

CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'terminee' AND (OLD.statut IS DISTINCT FROM 'terminee') THEN
    UPDATE clients SET
      total_prestations = total_prestations + 1,
      total_depense     = total_depense + NEW.prix_final,
      derniere_visite   = NOW(),
      updated_at        = NOW()
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_stats
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_client_stats();

SELECT 'Migration 01 OK — Tables de base créées.' AS status;
