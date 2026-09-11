# ADORÉA — Beauty Studio Platform

PMU · Makeup Pro · Nails · Certified Belgium  
adorea-dj.com

---

## Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth + PostgreSQL + Storage + RLS)
- Tailwind CSS
- Recharts
- Framer Motion

---

## Installation locale

```bash
git clone https://github.com/TON_COMPTE/adorea.git
cd adorea
npm install
```

Copier `.env.local` et renseigner les clés :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WA_NUMBER=25377596159
NEXT_PUBLIC_SITE_URL=https://adorea-dj.com
```

```bash
npm run dev
# → http://localhost:3000
```

---

## Base de données

Exécuter dans l'ordre dans Supabase → SQL Editor :

1. `adorea_migration_01_base.sql`
2. `adorea_migration_02_rls_seed.sql`
3. `adorea_migration_03_booking.sql`

---

## Créer le premier admin

Dans Supabase → Authentication → Users → Add user :
- email : adlina@adorea-dj.com
- password : (choisir)

Puis dans SQL Editor :
```sql
INSERT INTO profiles (id, email, nom, prenom, role)
SELECT id, email, 'Adlina', 'Admin', 'super_admin'
FROM auth.users WHERE email = 'adlina@adorea-dj.com';
```

---

## Deploy sur Vercel

```bash
npm install -g vercel
vercel
```

Variables d'environnement à ajouter dans Vercel Dashboard :
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_WA_NUMBER
- NEXT_PUBLIC_SITE_URL

Domaine personnalisé : adorea-dj.com → ajouter dans Vercel → Domains

---

## Structure

```
src/
├── app/
│   ├── page.tsx              Landing public
│   ├── login/                Connexion admin
│   ├── admin/                Espace admin (protégé)
│   │   ├── page.tsx          Dashboard + graphiques
│   │   ├── appointments/     Rendez-vous
│   │   ├── caisse/           Caisse directe
│   │   ├── clients/          CRM clientes
│   │   ├── services/         Prestations
│   │   ├── employees/        Équipe
│   │   ├── planning/         Planning employés
│   │   ├── loyalty/          Fidélité
│   │   ├── promotions/       Promos & codes
│   │   ├── accounting/       Comptabilité
│   │   ├── expenses/         Dépenses
│   │   ├── gallery/          Galerie avant/après
│   │   └── settings/         Paramètres site
│   └── api/
│       ├── booking/          POST créer RDV
│       ├── slots/            GET créneaux dispo
│       └── client/           GET recherche cliente
├── lib/
│   ├── supabase.ts           Client browser
│   ├── supabase-server.ts    Client serveur
│   └── supabase-admin.ts     Service role
└── types/
    └── index.ts              Types TypeScript complets
```

---

## Fonctionnalités

### Site public
- Landing premium FR/EN/AR (RTL arabe)
- Toggle langue + Toggle WhatsApp
- Island nav bar fixe
- 4 univers (Sourcils, Lèvres, Makeup, Nails)
- Slider Avant/Après interactif
- Flow réservation 5 étapes
- Questionnaire santé + signature
- 4 modes de paiement (CAC PAY, WAAFI, D-MONEY, CASH)
- Cash désactivé si 0 prestation historique

### Admin
- Dashboard avec KPIs + graphiques
- Gestion rendez-vous (statuts, timeline)
- Validation santé avec WhatsApp
- Caisse directe (5 étapes)
- CRM clientes complet
- Planning employés
- Fidélité configurable
- Promotions + codes promo
- Comptabilité (CA, dépenses, résultat)
- Galerie avant/après
- Paramètres site

### Technique
- Anti-double-booking via trigger SQL
- Attribution auto employé disponible
- RLS sur toutes les tables sensibles
- Audit logs
- SEO + Schema.org BeautySalon
- Mobile-first

---

## Contact

adlina@adorea-dj.com  
+253 77 59 61 59  
PK13 – Bâtiment B1-2, Djibouti Ville
# ADORÉA — Build Fri Sep 11 08:35:18 UTC 2026
