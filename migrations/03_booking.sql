-- ============================================================
-- ADORÉA — MIGRATION 03 — BOOKING ENGINE
-- Moteur anti-double-booking + fonctions de disponibilité
-- Coller APRÈS migration 02
-- ============================================================

-- ============================================================
-- CONTRAINTE ANTI-DOUBLE-BOOKING
-- Empêche 2 RDV simultanés sur le même employé
-- ============================================================

CREATE OR REPLACE FUNCTION check_no_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE employee_id  = NEW.employee_id
      AND date_rdv     = NEW.date_rdv
      AND id          <> NEW.id
      AND statut NOT IN ('annulee', 'absente', 'refusee')
      AND (
        (heure_debut, heure_fin) OVERLAPS (NEW.heure_debut, NEW.heure_fin)
      )
  ) THEN
    RAISE EXCEPTION 'DOUBLE_BOOKING: créneau déjà pris pour cet employé (%, % – %)',
      NEW.date_rdv, NEW.heure_debut, NEW.heure_fin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_overlap
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION check_no_overlap();

-- ============================================================
-- FONCTION : employés disponibles pour un créneau
-- Retourne les employés libres pour une prestation donnée
-- à une date + heure de début données
-- ============================================================

CREATE OR REPLACE FUNCTION get_available_employees(
  p_service_id    UUID,
  p_date          DATE,
  p_heure_debut   TIME
)
RETURNS TABLE (
  employee_id   UUID,
  nom           TEXT,
  prenom        TEXT
) AS $$
DECLARE
  v_duree     INTEGER;
  v_buffer    INTEGER;
  v_heure_fin TIME;
BEGIN
  -- Récupérer durée + buffer de la prestation
  SELECT duree_minutes, buffer_minutes
  INTO v_duree, v_buffer
  FROM services WHERE id = p_service_id;

  v_heure_fin := p_heure_debut + (v_duree + v_buffer) * INTERVAL '1 minute';

  RETURN QUERY
  SELECT e.id, e.nom, e.prenom
  FROM employees e
  -- L'employé est autorisé à faire cette prestation
  JOIN employee_services es ON es.employee_id = e.id AND es.service_id = p_service_id
  -- L'employé est actif
  WHERE e.actif = TRUE
  -- L'employé n'est pas absent ce jour-là
  AND NOT EXISTS (
    SELECT 1 FROM employee_absences ea
    WHERE ea.employee_id = e.id
      AND p_date BETWEEN ea.date_debut AND ea.date_fin
  )
  -- L'employé a un planning ce jour-là et le créneau est dans ses heures
  AND EXISTS (
    SELECT 1 FROM schedule_slots ss
    JOIN employee_schedules esc ON esc.id = ss.schedule_id
    WHERE esc.employee_id = e.id
      AND esc.date_jour = p_date
      AND esc.est_disponible = TRUE
      AND ss.heure_debut <= p_heure_debut
      AND ss.heure_fin   >= v_heure_fin
  )
  -- Pas de RDV qui se chevauche
  AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.employee_id = e.id
      AND a.date_rdv = p_date
      AND a.statut NOT IN ('annulee', 'absente', 'refusee')
      AND (a.heure_debut, a.heure_fin) OVERLAPS (p_heure_debut, v_heure_fin)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : créneaux disponibles pour un jour donné
-- Retourne tous les créneaux libres pour un service + date
-- ============================================================

CREATE OR REPLACE FUNCTION get_available_slots(
  p_service_id  UUID,
  p_date        DATE
)
RETURNS TABLE (
  heure_debut   TIME,
  heure_fin     TIME,
  nb_employes   BIGINT
) AS $$
DECLARE
  v_duree       INTEGER;
  v_buffer      INTEGER;
  v_slot_debut  TIME;
  v_slot_fin    TIME;
  v_pas         INTERVAL := '15 minutes';
  v_count       BIGINT;
BEGIN
  SELECT duree_minutes, buffer_minutes
  INTO v_duree, v_buffer
  FROM services WHERE id = p_service_id;

  -- Générer tous les créneaux de 15 en 15 min entre 08:00 et 19:00
  v_slot_debut := '08:00'::TIME;

  WHILE v_slot_debut + (v_duree + v_buffer) * INTERVAL '1 minute' <= '19:30'::TIME LOOP
    v_slot_fin := v_slot_debut + v_duree * INTERVAL '1 minute';

    -- Compter les employés disponibles pour ce créneau
    SELECT COUNT(*) INTO v_count
    FROM get_available_employees(p_service_id, p_date, v_slot_debut);

    IF v_count > 0 THEN
      heure_debut := v_slot_debut;
      heure_fin   := v_slot_fin;
      nb_employes := v_count;
      RETURN NEXT;
    END IF;

    v_slot_debut := v_slot_debut + v_pas;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : jours disponibles dans un mois
-- Pour afficher le calendrier (quels jours ont des créneaux)
-- ============================================================

CREATE OR REPLACE FUNCTION get_available_days(
  p_service_id  UUID,
  p_year        INTEGER,
  p_month       INTEGER
)
RETURNS TABLE (
  jour          DATE,
  a_des_creneaux BOOLEAN
) AS $$
DECLARE
  v_debut DATE;
  v_fin   DATE;
  v_jour  DATE;
  v_count BIGINT;
BEGIN
  v_debut := MAKE_DATE(p_year, p_month, 1);
  v_fin   := (v_debut + INTERVAL '1 month - 1 day')::DATE;
  v_jour  := v_debut;

  -- Ne pas afficher les jours passés
  IF v_debut < CURRENT_DATE THEN
    v_jour := CURRENT_DATE + 1;
  END IF;

  WHILE v_jour <= v_fin LOOP
    SELECT COUNT(*) INTO v_count
    FROM get_available_slots(p_service_id, v_jour)
    LIMIT 1;

    jour           := v_jour;
    a_des_creneaux := v_count > 0;
    RETURN NEXT;

    v_jour := v_jour + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : créer un rendez-vous (transactionnelle)
-- Assigne auto un employé + bloque le créneau
-- ============================================================

CREATE OR REPLACE FUNCTION create_appointment(
  p_client_id     UUID,
  p_service_id    UUID,
  p_date          DATE,
  p_heure_debut   TIME,
  p_payment_method payment_method DEFAULT 'cash',
  p_promo_code    TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_employee      RECORD;
  v_service       RECORD;
  v_promo         RECORD;
  v_prix_final    NUMERIC(10,2);
  v_remise_pct    NUMERIC(5,2) := 0;
  v_remise_fixe   NUMERIC(10,2) := 0;
  v_heure_fin     TIME;
  v_appointment   appointments;
  v_promo_id      UUID := NULL;
BEGIN
  -- Récupérer service
  SELECT * INTO v_service FROM services WHERE id = p_service_id AND actif = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'SERVICE_NOT_FOUND');
  END IF;

  v_heure_fin := p_heure_debut + v_service.duree_minutes * INTERVAL '1 minute';

  -- Vérifier code promo si fourni
  IF p_promo_code IS NOT NULL THEN
    SELECT pc.* INTO v_promo
    FROM promo_codes pc
    WHERE pc.code = UPPER(p_promo_code)
      AND pc.actif = TRUE
      AND (pc.date_debut IS NULL OR pc.date_debut <= CURRENT_DATE)
      AND (pc.date_fin IS NULL OR pc.date_fin >= CURRENT_DATE)
      AND (pc.service_id IS NULL OR pc.service_id = p_service_id)
      AND (pc.category_id IS NULL OR pc.category_id = v_service.category_id)
      AND (pc.nb_utilisations_max IS NULL OR pc.nb_utilisations_actuel < pc.nb_utilisations_max)
      AND (pc.montant_min IS NULL OR pc.montant_min <= v_service.prix);

    IF FOUND THEN
      v_promo_id    := v_promo.id;
      v_remise_pct  := COALESCE(v_promo.remise_pct, 0);
      v_remise_fixe := COALESCE(v_promo.remise_fixe, 0);
    ELSE
      RETURN jsonb_build_object('error', 'PROMO_INVALID');
    END IF;
  END IF;

  -- Calculer prix final
  v_prix_final := v_service.prix;
  IF v_remise_pct > 0 THEN
    v_prix_final := v_prix_final * (1 - v_remise_pct / 100);
  END IF;
  IF v_remise_fixe > 0 THEN
    v_prix_final := GREATEST(0, v_prix_final - v_remise_fixe);
  END IF;

  -- Choisir un employé disponible (aléatoire parmi les dispo)
  SELECT * INTO v_employee
  FROM get_available_employees(p_service_id, p_date, p_heure_debut)
  ORDER BY RANDOM()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'NO_EMPLOYEE_AVAILABLE');
  END IF;

  -- Créer le rendez-vous
  INSERT INTO appointments (
    client_id, service_id, employee_id,
    date_rdv, heure_debut, heure_fin,
    prix_final, remise_pct, remise_fixe, code_promo_id,
    payment_method, statut
  ) VALUES (
    p_client_id, p_service_id, v_employee.employee_id,
    p_date, p_heure_debut, v_heure_fin,
    v_prix_final, NULLIF(v_remise_pct, 0), NULLIF(v_remise_fixe, 0), v_promo_id,
    p_payment_method, 'creee'
  )
  RETURNING * INTO v_appointment;

  -- Incrémenter usage promo
  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes SET nb_utilisations_actuel = nb_utilisations_actuel + 1
    WHERE id = v_promo_id;

    INSERT INTO promo_code_usage (promo_id, client_id, appointment_id)
    VALUES (v_promo_id, p_client_id, v_appointment.id);
  END IF;

  RETURN jsonb_build_object(
    'success',      TRUE,
    'appointment_id', v_appointment.id,
    'reference',    v_appointment.reference,
    'employee_id',  v_employee.employee_id,
    'heure_debut',  p_heure_debut,
    'heure_fin',    v_heure_fin,
    'prix_final',   v_prix_final,
    'statut',       'creee'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : vérifier si cash autorisé pour un client
-- Cash désactivé si 0 prestation terminée
-- ============================================================

CREATE OR REPLACE FUNCTION can_pay_cash(p_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT total_prestations > 0 FROM clients WHERE id = p_client_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- FONCTION : dupliquer planning d'un employé
-- Copier le planning d'un jour vers plusieurs jours
-- ============================================================

CREATE OR REPLACE FUNCTION duplicate_schedule(
  p_employee_id   UUID,
  p_source_date   DATE,
  p_target_dates  DATE[]
)
RETURNS INTEGER AS $$
DECLARE
  v_source    employee_schedules;
  v_slots     schedule_slots[];
  v_new_sched employee_schedules;
  v_target    DATE;
  v_count     INTEGER := 0;
BEGIN
  -- Récupérer le planning source
  SELECT * INTO v_source
  FROM employee_schedules
  WHERE employee_id = p_employee_id AND date_jour = p_source_date
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Récupérer les slots source
  SELECT ARRAY_AGG(ss.*) INTO v_slots
  FROM schedule_slots ss
  JOIN employee_schedules es ON es.id = ss.schedule_id
  WHERE es.employee_id = p_employee_id AND es.date_jour = p_source_date;

  -- Dupliquer vers chaque date cible
  FOREACH v_target IN ARRAY p_target_dates LOOP
    -- Supprimer l'existant si présent
    DELETE FROM employee_schedules
    WHERE employee_id = p_employee_id AND date_jour = v_target;

    -- Insérer nouveau planning
    INSERT INTO employee_schedules (employee_id, date_jour, est_disponible, notes)
    VALUES (p_employee_id, v_target, v_source.est_disponible, v_source.notes)
    RETURNING * INTO v_new_sched;

    -- Dupliquer les slots
    IF v_slots IS NOT NULL THEN
      INSERT INTO schedule_slots (schedule_id, heure_debut, heure_fin)
      SELECT v_new_sched.id, (s).heure_debut, (s).heure_fin
      FROM UNNEST(v_slots) s;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : retouches à relancer (PMU)
-- Renvoie les clientes dont la retouche approche
-- ============================================================

CREATE OR REPLACE FUNCTION get_upcoming_touchups(p_jours_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  client_id       UUID,
  client_nom      TEXT,
  client_prenom   TEXT,
  client_tel      TEXT,
  service_nom     TEXT,
  derniere_seance DATE,
  retouche_avant  DATE,
  retouche_apres  DATE,
  jours_restants  INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nom,
    c.prenom,
    c.telephone,
    s.nom_fr,
    a.date_rdv,
    pr.prochaine_retouche_avant,
    pr.prochaine_retouche_apres,
    (pr.prochaine_retouche_avant - CURRENT_DATE)::INTEGER
  FROM pmu_records pr
  JOIN clients c   ON c.id  = pr.client_id
  JOIN services s  ON s.id  = pr.service_id
  LEFT JOIN appointments a ON a.id = pr.appointment_id
  WHERE pr.prochaine_retouche_avant IS NOT NULL
    AND pr.prochaine_retouche_avant BETWEEN CURRENT_DATE AND CURRENT_DATE + p_jours_ahead
  ORDER BY pr.prochaine_retouche_avant ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : dashboard stats (CA, RDV, etc.)
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_date_debut  DATE DEFAULT CURRENT_DATE,
  p_date_fin    DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_ca_encaisse   NUMERIC(10,2);
  v_nb_rdv        INTEGER;
  v_nb_clientes   INTEGER;
  v_panier_moyen  NUMERIC(10,2);
  v_ca_cash       NUMERIC(10,2);
  v_ca_digital    NUMERIC(10,2);
  v_depenses      NUMERIC(10,2);
BEGIN
  SELECT
    COALESCE(SUM(a.prix_final), 0),
    COUNT(*),
    COUNT(DISTINCT a.client_id),
    COALESCE(AVG(a.prix_final), 0)
  INTO v_ca_encaisse, v_nb_rdv, v_nb_clientes, v_panier_moyen
  FROM appointments a
  WHERE a.date_rdv BETWEEN p_date_debut AND p_date_fin
    AND a.statut = 'terminee';

  SELECT COALESCE(SUM(a.prix_final), 0) INTO v_ca_cash
  FROM appointments a
  WHERE a.date_rdv BETWEEN p_date_debut AND p_date_fin
    AND a.statut = 'terminee'
    AND a.payment_method = 'cash';

  SELECT COALESCE(SUM(a.prix_final), 0) INTO v_ca_digital
  FROM appointments a
  WHERE a.date_rdv BETWEEN p_date_debut AND p_date_fin
    AND a.statut = 'terminee'
    AND a.payment_method != 'cash';

  SELECT COALESCE(SUM(montant), 0) INTO v_depenses
  FROM expenses
  WHERE date_depense BETWEEN p_date_debut AND p_date_fin;

  RETURN jsonb_build_object(
    'ca_encaisse',   v_ca_encaisse,
    'nb_rdv',        v_nb_rdv,
    'nb_clientes',   v_nb_clientes,
    'panier_moyen',  ROUND(v_panier_moyen, 0),
    'ca_cash',       v_ca_cash,
    'ca_digital',    v_ca_digital,
    'depenses',      v_depenses,
    'resultat_net',  v_ca_encaisse - v_depenses
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : CA par catégorie (pour graphiques)
-- ============================================================

CREATE OR REPLACE FUNCTION get_ca_by_category(
  p_date_debut DATE,
  p_date_fin   DATE
)
RETURNS TABLE (
  categorie_nom TEXT,
  ca_total      NUMERIC(10,2),
  nb_rdv        BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cat.nom_fr,
    COALESCE(SUM(a.prix_final), 0)::NUMERIC(10,2),
    COUNT(*)
  FROM appointments a
  JOIN services s   ON s.id  = a.service_id
  JOIN categories cat ON cat.id = s.category_id
  WHERE a.date_rdv BETWEEN p_date_debut AND p_date_fin
    AND a.statut = 'terminee'
  GROUP BY cat.nom_fr
  ORDER BY SUM(a.prix_final) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTION : CA par employé
-- ============================================================

CREATE OR REPLACE FUNCTION get_ca_by_employee(
  p_date_debut DATE,
  p_date_fin   DATE
)
RETURNS TABLE (
  employee_nom    TEXT,
  ca_total        NUMERIC(10,2),
  nb_rdv          BIGINT,
  commission_due  NUMERIC(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.prenom || ' ' || e.nom,
    COALESCE(SUM(a.prix_final), 0)::NUMERIC(10,2),
    COUNT(*),
    COALESCE(
      CASE
        WHEN e.commission_pct IS NOT NULL
          THEN SUM(a.prix_final) * e.commission_pct / 100
        WHEN e.commission_fixe IS NOT NULL
          THEN COUNT(*) * e.commission_fixe
        ELSE 0
      END, 0
    )::NUMERIC(10,2)
  FROM appointments a
  JOIN employees e ON e.id = a.employee_id
  WHERE a.date_rdv BETWEEN p_date_debut AND p_date_fin
    AND a.statut = 'terminee'
  GROUP BY e.id, e.prenom, e.nom, e.commission_pct, e.commission_fixe
  ORDER BY SUM(a.prix_final) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANTS — accès public aux fonctions de booking
-- (appelées via service role depuis le frontend)
-- ============================================================

GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_available_days(UUID, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_pay_cash(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ca_by_category(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ca_by_employee(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_touchups(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION duplicate_schedule(UUID, DATE, DATE[]) TO authenticated;

SELECT 'Migration 03 OK — Booking engine prêt.' AS status;
