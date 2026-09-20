-- ============================================================
-- ADORÉA — MIGRATION 08 — Promos countdown + PIN admin
-- À coller dans Supabase → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROMOS — colonnes pour le compte à rebours et l'auto-relance
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS date_fin_heure    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_repeat       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duree_heures      INTEGER,
  ADD COLUMN IF NOT EXISTS afficher_site     BOOLEAN NOT NULL DEFAULT FALSE;

-- ────────────────────────────────────────────────────────────
-- 2. PIN ADMIN — colonnes sur profiles
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_pin_hash  TEXT,       -- SHA-256 du PIN (4-6 chiffres)
  ADD COLUMN IF NOT EXISTS avatar_initials TEXT;       -- ex: "AD"

-- ────────────────────────────────────────────────────────────
-- 3. Vérification
-- ────────────────────────────────────────────────────────────
SELECT 'Migration 08 OK' AS status;
