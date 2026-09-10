/**
 * ADORÉA — WhatsApp message helpers
 * Tous les messages pré-remplis centralisés ici
 */

const WA_BASE = 'https://wa.me/'

export function waLink(numero: string, message: string): string {
  const tel = numero.replace(/\D/g, '')
  return `${WA_BASE}${tel}?text=${encodeURIComponent(message)}`
}

// ── Messages clients ─────────────────────────────────────────────

export function waBookingConfirm(opts: {
  prenom: string
  service: string
  date: string
  heure: string
  montant: string
  reference: string
}) {
  return `Bonjour ${opts.prenom} ✨

Votre réservation ADORÉA est confirmée.

Prestation : ${opts.service}
Date : ${opts.date}
Heure : ${opts.heure}
Montant : ${opts.montant}
Référence : ${opts.reference}

Nous avons hâte de vous accueillir.
À très bientôt 🌸

ADORÉA — PMU · Makeup Pro · Nails
+253 77 59 61 59`
}

export function waHealthValidation(opts: {
  prenom: string
  service: string
  date: string
  heure: string
  reference: string
}) {
  return `Bonjour ADORÉA,

Je viens d'effectuer une demande de rendez-vous.

Prestation : ${opts.service}
Date : ${opts.date}
Heure : ${opts.heure}
Référence : ${opts.reference}

Une information de santé nécessite une validation avant confirmation définitive du rendez-vous.

J'attends votre confirmation.

Merci.`
}

export function waPaymentProof(opts: {
  prenom: string
  service: string
  date: string
  heure: string
  montant: string
  reference: string
  methode: string
}) {
  return `Bonjour ADORÉA,

Je viens d'effectuer le paiement de ma réservation.

Nom : ${opts.prenom}
Prestation : ${opts.service}
Date : ${opts.date}
Heure : ${opts.heure}
Montant : ${opts.montant}
Méthode : ${opts.methode}
Référence : ${opts.reference}

Je joins mon screenshot de paiement ci-dessous.`
}

export function waRappel(opts: {
  prenom: string
  service: string
  date: string
  heure: string
}) {
  return `Bonjour ${opts.prenom},

Petit rappel pour votre rendez-vous ADORÉA 🌸

Prestation : ${opts.service}
Date : ${opts.date}
Heure : ${opts.heure}

Nous vous attendons avec impatience.
À très bientôt ✨

ADORÉA
+253 77 59 61 59`
}

export function waRetouche(opts: {
  prenom: string
  service: string
  derniereSeance: string
  retoucheAvant: string
  prix: string
}) {
  return `Bonjour ${opts.prenom},

Votre retouche ADORÉA approche 🌸

Prestation : ${opts.service}
Dernière séance : ${opts.derniereSeance}
Retouche recommandée avant : ${opts.retoucheAvant}
Prix retouche : ${opts.prix}

Vous pouvez réserver votre créneau dès maintenant.

ADORÉA
+253 77 59 61 59`
}

export function waFideliteOffer(opts: {
  prenom: string
  recompense: string
  validite?: string
}) {
  return `Bonjour ${opts.prenom},

Vous venez de débloquer une récompense ADORÉA ✨

Récompense : ${opts.recompense}
${opts.validite ? `Validité : ${opts.validite}` : ''}

Nous serons ravies de vous recevoir à nouveau.

ADORÉA — PMU · Makeup Pro · Nails
+253 77 59 61 59`
}

export function waContactClient(opts: { prenom: string }) {
  return `Bonjour ${opts.prenom},

Nous vous contactons de la part d'ADORÉA.

N'hésitez pas à nous répondre.
À très bientôt ✨

ADORÉA
+253 77 59 61 59`
}

export function waPaymentRequest(opts: {
  prenom: string
  montant: string
  methode: string
  reference: string
}) {
  return `Bonjour ${opts.prenom},

Votre paiement pour la réservation ${opts.reference} est en attente.

Montant : ${opts.montant}
Méthode : ${opts.methode}

Merci de nous envoyer votre screenshot de paiement dès que possible.

ADORÉA
+253 77 59 61 59`
}
