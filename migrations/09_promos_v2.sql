-- ═══════════════════════════════════════════════════════
-- PROMOS V2 — multi-prestations + édition
-- ═══════════════════════════════════════════════════════

-- Plusieurs prestations ciblées par promo
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS service_ids UUID[],
  ADD COLUMN IF NOT EXISTS auto_apply  BOOLEAN NOT NULL DEFAULT TRUE;

-- Index pour les recherches de code
CREATE INDEX IF NOT EXISTS idx_promo_code_upper
  ON public.promo_codes (UPPER(code));

SELECT 'Migration 09 OK' AS status;
