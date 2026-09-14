/**
 * Normalisation des numéros de téléphone.
 * Objectif : qu'un même numéro saisi "0766654551", "+253766654551"
 * ou "766654551" désigne toujours la même cliente.
 */

/** Garde uniquement les chiffres */
export const digitsOnly = (v: string) => (v || '').replace(/\D/g, '')

/**
 * Clé de comparaison : les 8 derniers chiffres.
 * Suffisant pour Djibouti (8 chiffres) et assez discriminant ailleurs.
 */
export function phoneKey(v: string): string {
  const d = digitsOnly(v)
  return d.slice(-8)
}

/**
 * Met un numéro au format E.164 avec un indicatif par défaut.
 * "0766654551" + DJ  ->  "+253766654551"
 * "+33612345678"      ->  inchangé
 */
export function toE164(v: string, defaultDial = '+253'): string {
  const raw = (v || '').trim().replace(/[\s.\-()]/g, '')
  if (!raw) return ''
  if (raw.startsWith('+')) return raw
  if (raw.startsWith('00')) return '+' + raw.slice(2)
  // Numéro local : on retire le 0 initial puis on préfixe
  const local = raw.replace(/^0+/, '')
  return defaultDial + local
}

/** Affichage lisible : +253 77 74 33 22 */
export function formatPhone(v: string): string {
  const d = digitsOnly(v)
  if (!d) return ''
  if (v.startsWith('+253') || d.startsWith('253')) {
    const local = d.slice(-8)
    return '+253 ' + local.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  return v
}
