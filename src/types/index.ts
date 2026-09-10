// ============================================================
// ADORÉA — Types TypeScript
// ============================================================

export type UserRole = 'super_admin' | 'manager' | 'employe' | 'caisse'
export type Lang = 'fr' | 'en' | 'ar'
export type PaymentMethod = 'cac_pay' | 'waafi' | 'd_money' | 'cash'
export type PaymentStatus = 'en_attente' | 'valide' | 'rembourse' | 'echoue'
export type AbsenceType = 'conge' | 'absence' | 'indisponibilite' | 'rdv_perso' | 'journee_bloquee'
export type ExpenseCategory = 'pigments' | 'makeup' | 'nails' | 'consommables' | 'hygiene' | 'materiel' | 'mobilier' | 'marketing' | 'transport' | 'autre'
export type RewardType = 'reduction_pct' | 'reduction_fixe' | 'bon' | 'prestation_offerte'

export type AppointmentStatus =
  | 'creee' | 'paiement_attendu' | 'paiement_envoye' | 'a_valider'
  | 'confirmee' | 'cliente_arrivee' | 'en_cours' | 'terminee'
  | 'annulee' | 'absente' | 'refusee'

export interface Profile {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  telephone: string | null
  photo_url: string | null
  role: UserRole
  actif: boolean
  created_at: string
}

export interface Employee {
  id: string
  profile_id: string | null
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  photo_url: string | null
  role: UserRole
  actif: boolean
  commission_on: boolean
  commission_pct: number | null
  commission_fixe: number | null
  notes_internes: string | null
  whatsapp_number: string | null
  created_at: string
}

export interface Category {
  id: string
  slug: string
  nom_fr: string
  nom_en: string | null
  nom_ar: string | null
  desc_fr: string | null
  desc_en: string | null
  desc_ar: string | null
  image_url: string | null
  actif: boolean
  ordre: number
}

export interface Service {
  id: string
  category_id: string
  slug: string
  nom_fr: string
  nom_en: string | null
  nom_ar: string | null
  desc_fr: string | null
  desc_en: string | null
  desc_ar: string | null
  prix: number
  prix_sur_devis: boolean
  duree_minutes: number
  buffer_minutes: number
  image_url: string | null
  actif: boolean
  ordre: number
  is_pmu: boolean
  retouche_delai_min_jours: number | null
  retouche_delai_max_jours: number | null
  whatsapp_validation_number: string | null
  // Relations
  category?: Category
  promotion?: Promotion | null
}

export interface Client {
  id: string
  nom: string
  prenom: string
  date_naissance: string | null
  telephone: string
  email: string | null
  notes_internes: string | null
  total_prestations: number
  total_depense: number
  derniere_visite: string | null
  created_at: string
}

export interface ClientHealthForm {
  id: string
  client_id: string
  appointment_id: string | null
  grossesse: boolean
  diabete: boolean
  allergies: boolean
  traitement_med: boolean
  pb_peau: boolean
  herpes: boolean
  anticoagulants: boolean
  commentaires: string | null
  has_contraindication: boolean
  created_at: string
}

export interface ClientConsent {
  id: string
  client_id: string
  appointment_id: string | null
  consent_text: string
  consent_version: string
  signature_data: string | null
  ip_address: string | null
  signed_at: string
}

export interface Appointment {
  id: string
  client_id: string
  service_id: string
  employee_id: string | null
  date_rdv: string
  heure_debut: string
  heure_fin: string
  statut: AppointmentStatus
  prix_final: number
  remise_pct: number | null
  remise_fixe: number | null
  code_promo_id: string | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  notes_admin: string | null
  reference: string
  health_validated: boolean | null
  created_by: string | null
  is_walkin: boolean
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  service?: Service
  employee?: Employee
  health_form?: ClientHealthForm
}

export interface AvailableSlot {
  heure_debut: string
  heure_fin: string
  nb_employes: number
}

export interface Payment {
  id: string
  appointment_id: string
  montant: number
  methode: PaymentMethod
  statut: PaymentStatus
  reference_ext: string | null
  screenshot_url: string | null
  validated_by: string | null
  validated_at: string | null
  created_at: string
}

export interface Promotion {
  id: string
  service_id: string | null
  category_id: string | null
  nom: string
  remise_pct: number | null
  remise_fixe: number | null
  date_debut: string
  date_fin: string
  nb_utilisations_max: number | null
  nb_utilisations_actuel: number
  actif: boolean
}

export interface PromoCode {
  id: string
  code: string
  remise_pct: number | null
  remise_fixe: number | null
  montant_min: number | null
  service_id: string | null
  category_id: string | null
  date_debut: string | null
  date_fin: string | null
  nb_utilisations_max: number | null
  nb_utilisations_actuel: number
  nb_par_cliente_max: number | null
  actif: boolean
}

export interface PmuRecord {
  id: string
  client_id: string
  service_id: string
  appointment_id: string | null
  pigment: string | null
  technique: string | null
  notes: string | null
  prochaine_retouche_avant: string | null
  prochaine_retouche_apres: string | null
  created_at: string
  photos?: PmuPhoto[]
}

export interface PmuPhoto {
  id: string
  record_id: string
  url: string
  type: 'avant' | 'apres'
  public_gallery: boolean
  uploaded_by: string | null
  created_at: string
}

export interface LoyaltyRule {
  id: string
  nom: string
  condition_type: string
  condition_valeur: number | null
  operateur: string
  reward_type: RewardType
  reward_valeur: number | null
  validite_jours: number | null
  actif: boolean
}

export interface ClientReward {
  id: string
  client_id: string
  rule_id: string
  reward_type: RewardType
  reward_valeur: number | null
  code_bon: string | null
  expire_at: string | null
  utilise: boolean
  utilise_at: string | null
  created_at: string
}

export interface Expense {
  id: string
  date_depense: string
  produit: string
  categorie: ExpenseCategory
  quantite: number
  montant: number
  marque: string | null
  fournisseur: string | null
  photo_recu_url: string | null
  notes: string | null
  saisi_par: string | null
  created_at: string
}

export interface CashClosing {
  id: string
  date_cloture: string
  cash_theorique: number
  cash_reel: number
  ecart: number
  commentaire: string | null
  ferme_par: string | null
  created_at: string
}

export interface DashboardStats {
  ca_encaisse: number
  nb_rdv: number
  nb_clientes: number
  panier_moyen: number
  ca_cash: number
  ca_digital: number
  depenses: number
  resultat_net: number
}

export interface EmployeeSchedule {
  id: string
  employee_id: string
  date_jour: string
  est_disponible: boolean
  notes: string | null
  slots: ScheduleSlot[]
}

export interface ScheduleSlot {
  id: string
  schedule_id: string
  heure_debut: string
  heure_fin: string
}

export interface SiteSettings {
  [key: string]: string
}

// Booking flow state
export interface BookingState {
  step: number
  service: Service | null
  date: Date | null
  slot: AvailableSlot | null
  client: Partial<Client> | null
  healthForm: Partial<ClientHealthForm> | null
  consentSigned: boolean
  signatureData: string | null
  paymentMethod: PaymentMethod | null
  promoCode: string | null
}

// WhatsApp message helpers
export interface WhatsAppConfig {
  enabled: boolean
  numero_principal: string
  paiements: boolean
  validation_sante: boolean
  rappels: boolean
  bouton_flottant: boolean
  reservation: boolean
  retouches: boolean
  fidelite: boolean
}
