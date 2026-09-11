'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const C = {
  noir:    '#0A0807',
  brun:    '#1C1410',
  or:      '#C9A96A',
  orClair: '#E2C07A',
  orFonce: '#9A7840',
  creme:   '#F4EAD8',
  beige:   '#E6D4B8',
  nude:    '#C9956A',
  taupe:   '#7A5C42',
  blanc:   '#FAF6F0',
  muted:   'rgba(250,246,240,0.5)',
}

type Lang = 'FR' | 'EN' | 'AR'

const T = {
  FR: {
    nav: ['Accueil','Rendez-vous','Sourcils','Lèvres','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    tagline: 'BEAUTY · CONFIDENCE · YOU',
    h1a: 'Révèle ta beauté,',
    h1b: 'affirme ta confiance',
    cta1: 'Réserver maintenant',
    cta2: 'Découvrir',
    brand_tag: 'La beauté de Djibouti aux mains d\'expertes',
    brand_h: 'Art\nBeauté\nConfiance',
    brand_kw: ['ÉLÉGANCE', 'TECHNIQUE', 'BEAUTÉ DURABLE'],
    svc_tag: 'NOS PRESTATIONS',
    svc_sub: 'Expertise & précision — résultats naturels',
    ba_tag: 'AVANT · APRÈS',
    ba_h: 'Les résultats\nparlent',
    book_tag: 'RÉSERVATION',
    book_h: 'Prenez\nrendez-vous',
    book_sub: 'Choisissez votre soin, votre créneau. Votre experte vous confirme sous 24h.',
    book_btn: 'Réserver un créneau',
    contact_tag: 'NOUS TROUVER',
    hours: 'Lun – Sam · 09h – 19h',
    rights: '© 2025 ADORÉA. Tous droits réservés.',
    bef: 'Avant', aft: 'Après',
    next: 'Suivant', prev: 'Retour', confirm: 'Confirmer',
    book_step: ['Soin', 'Date & Heure', 'Vos infos', 'Santé', 'Paiement'],
  },
  EN: {
    nav: ['Home','Book','Brows','Lips','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    tagline: 'BEAUTY · CONFIDENCE · YOU',
    h1a: 'Reveal your beauty,',
    h1b: 'affirm your confidence',
    cta1: 'Book now', cta2: 'Discover',
    brand_tag: 'Djibouti beauty in expert hands',
    brand_h: 'Art\nBeauty\nConfidence',
    brand_kw: ['ELEGANCE', 'TECHNIQUE', 'LASTING BEAUTY'],
    svc_tag: 'OUR SERVICES',
    svc_sub: 'Expertise & precision — natural results',
    ba_tag: 'BEFORE · AFTER',
    ba_h: 'Results\nspeak',
    book_tag: 'BOOKING',
    book_h: 'Book your\nappointment',
    book_sub: 'Choose your treatment and slot. Your expert confirms within 24h.',
    book_btn: 'Book a slot',
    contact_tag: 'FIND US',
    hours: 'Mon – Sat · 09:00 – 19:00',
    rights: '© 2025 ADORÉA. All rights reserved.',
    bef: 'Before', aft: 'After',
    next: 'Next', prev: 'Back', confirm: 'Confirm',
    book_step: ['Service', 'Date & Time', 'Your info', 'Health', 'Payment'],
  },
  AR: {
    nav: ['الرئيسية','حجز','الحواجب','الشفاه','ميكاب','أظافر','تواصل'],
    cert: 'معتمد بلجيكيًا',
    tagline: 'جمال · ثقة · أنتِ',
    h1a: 'اكشفي جمالك،',
    h1b: 'أكدي ثقتك بنفسك',
    cta1: 'احجزي الآن', cta2: 'اكتشفي',
    brand_tag: 'جمال جيبوتي بأيدي خبيرات',
    brand_h: 'فن\nجمال\nثقة',
    brand_kw: ['أناقة', 'تقنية', 'جمال دائم'],
    svc_tag: 'خدماتنا',
    svc_sub: 'خبرة ودقة — نتائج طبيعية',
    ba_tag: 'قبل · بعد',
    ba_h: 'النتائج\nتتحدث',
    book_tag: 'الحجز',
    book_h: 'احجزي\nموعدك',
    book_sub: 'اختاري خدمتك وموعدك. خبيرتك تؤكد خلال 24 ساعة.',
    book_btn: 'احجزي الآن',
    contact_tag: 'موقعنا',
    hours: 'الإثنين – السبت · ٩ص – ٧م',
    rights: '© 2025 ADORÉA. جميع الحقوق محفوظة.',
    bef: 'قبل', aft: 'بعد',
    next: 'التالي', prev: 'رجوع', confirm: 'تأكيد',
    book_step: ['الخدمة', 'التاريخ', 'بياناتك', 'الصحة', 'الدفع'],
  },
}

// Services avec catégories séparées Sourcils / Lèvres
const SERVICES = [
  {
    id: 'sourcils', cat: 'PMU — Sourcils',
    label: { FR: 'Sourcils PMU', EN: 'Brows PMU', AR: 'حواجب PMU' },
    desc: { FR: 'Restructuration et définition naturelle du regard. Powder Brows, Combo Brows — un résultat naturel qui dure.', EN: 'Natural brow restructuring. Powder Brows, Combo Brows — lasting natural results.', AR: 'إعادة هيكلة وتعريف طبيعي للحواجب. نتائج طبيعية دائمة.' },
    items: [
      { name: 'Powder Brows', devis: false },
      { name: 'Combo Brows', devis: false },
      { name: 'Retouche 1 mois', devis: false },
      { name: 'Retouche annuelle (9–15 mois)', devis: false },
      { name: 'Retouche annuelle (après 15 mois)', devis: true },
    ],
    img: '/images/sourcils-mirror.png',
    kw: 'PRÉCISION · SAVOIR-FAIRE · RÉSULTATS NATURELS',
    bg: C.noir,
  },
  {
    id: 'levres', cat: 'PMU — Lèvres',
    label: { FR: 'Lèvres PMU', EN: 'Lips PMU', AR: 'شفاه PMU' },
    desc: { FR: 'Des lèvres subtilement colorées et définies, longue tenue. Candy Lips et neutralisation des lèvres foncées.', EN: 'Subtly colored and defined lips. Candy Lips and dark lip neutralisation.', AR: 'شفاه ملونة ومحددة بشكل خفيف، طويلة الأمد.' },
    items: [
      { name: 'Candy Lips', devis: false },
      { name: 'Neutralisation lèvres foncées', devis: true },
      { name: 'Retouche annuelle (9–15 mois)', devis: false },
      { name: 'Retouche annuelle (après 15 mois)', devis: true },
    ],
    img: '/images/levres-closeup.png',
    kw: 'COLORATION SUBTILE · LONGUE TENUE',
    bg: C.brun,
  },
  {
    id: 'makeup', cat: 'Makeup Pro',
    label: { FR: 'Makeup Pro', EN: 'Pro Makeup', AR: 'ميكاب احترافي' },
    desc: { FR: 'Maquillage professionnel pour toutes vos occasions. Du quotidien au mariage, chaque regard est sculpté avec précision.', EN: 'Professional makeup for all occasions. From daily to wedding looks.', AR: 'مكياج احترافي لجميع مناسباتك.' },
    items: [
      { name: 'Makeup Jour', devis: false },
      { name: 'Makeup Soirée', devis: false },
      { name: 'Makeup Mariée', devis: false },
      { name: 'Essai Mariée', devis: false },
      { name: 'Shooting / Event', devis: true },
    ],
    img: '/images/makeup-profile.png',
    kw: 'DES REGARDS QUI MARQUENT · POUR TOUTES VOS OCCASIONS',
    bg: '#120E0A',
  },
  {
    id: 'nails', cat: 'Nails',
    label: { FR: 'Nails', EN: 'Nails', AR: 'أظافر' },
    desc: { FR: 'Manucure classique, semi-permanent et Nail Art — élégance jusque au bout des ongles.', EN: 'Classic manicure, semi-permanent and Nail Art.', AR: 'مانيكير كلاسيك، شبه دائم وناي آرت.' },
    items: [
      { name: 'Manucure classique', devis: false },
      { name: 'Semi-Permanent', devis: false },
      { name: 'Semi-Permanent French', devis: false },
      { name: 'Pédicure simple', devis: false },
      { name: 'Pédicure semi-permanent', devis: false },
      { name: 'Nail Art', devis: false },
    ],
    img: '/images/nails-hero.png',
    kw: 'ÉLÉGANCE JUSQUE AU BOUT DES ONGLES',
    bg: C.brun,
  },
]

const HEALTH_ITEMS = {
  FR: ['Grossesse', 'Diabète', 'Allergies', 'Traitement médical en cours', 'Problèmes de peau', 'Herpès (labial ou autre)', 'Anticoagulants'],
  EN: ['Pregnancy', 'Diabetes', 'Allergies', 'Ongoing medical treatment', 'Skin conditions', 'Herpes', 'Blood thinners'],
  AR: ['حمل', 'سكري', 'حساسية', 'علاج طبي حالي', 'مشاكل جلدية', 'هيرباس', 'مضادات التخثر'],
}

const BA = [
  { label: 'Powder Brows', before: '/images/pmu-brows.png', after: '/images/sourcils-mirror.png' },
  { label: 'Candy Lips', before: '/images/levres.png', after: '/images/levres-closeup.png' },
]

// ─── CSS ───────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Montserrat',sans-serif;background:${C.noir};color:${C.blanc};overflow-x:hidden;-webkit-font-smoothing:antialiased}

/* ── BOTTOM TOGGLES ── */
.bottom-toggles{position:fixed;bottom:28px;left:24px;z-index:400;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
[dir=rtl] .bottom-toggles{left:auto;right:24px;align-items:flex-end}

.lang-pill{background:rgba(10,8,7,0.9);backdrop-filter:blur(20px);border:1px solid rgba(201,169,106,0.2);border-radius:50px;display:flex;gap:2px;padding:3px}
.lang-pill button{background:transparent;border:none;border-radius:30px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.08em;padding:6px 12px;color:rgba(250,246,240,0.4);transition:all 0.2s}
.lang-pill button.on{background:${C.or};color:${C.noir};font-weight:600}

/* Toggle WA circulaire */
.wa-toggle-wrap{display:flex;align-items:center;gap:10px}
.wa-toggle-label{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.15em;color:rgba(250,246,240,0.4);text-transform:uppercase}
.wa-toggle{width:42px;height:22px;border-radius:11px;background:rgba(10,8,7,0.9);border:1px solid rgba(201,169,106,0.2);cursor:pointer;position:relative;transition:background 0.3s}
.wa-toggle.on{background:#25D366;border-color:#25D366}
.wa-toggle-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:white;transition:transform 0.3s;box-shadow:0 1px 4px rgba(0,0,0,0.3)}
.wa-toggle.on .wa-toggle-knob{transform:translateX(20px)}

/* ── ISLAND NAV ── */
.island{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:400;background:rgba(10,8,7,0.94);backdrop-filter:blur(24px);border:1px solid rgba(201,169,106,0.12);border-radius:100px;padding:9px 20px;display:flex;gap:2px;max-width:calc(100vw - 200px);overflow-x:auto;scrollbar-width:none}
.island::-webkit-scrollbar{display:none}
.island a{color:rgba(250,246,240,0.35);text-decoration:none;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;letter-spacing:0.1em;padding:7px 14px;border-radius:50px;white-space:nowrap;transition:all 0.25s}
.island a:hover,.island a.on{background:rgba(201,169,106,0.12);color:${C.or}}

/* ── WA FAB ── */
.wa-fab{position:fixed;bottom:88px;right:22px;z-index:390;width:52px;height:52px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 4px 24px rgba(37,211,102,0.4);transition:transform 0.2s,box-shadow 0.2s,opacity 0.3s}
.wa-fab:hover{transform:scale(1.08)}
.wa-fab.hidden{opacity:0;pointer-events:none}
[dir=rtl] .wa-fab{right:auto;left:22px}

/* ── SECTION TRANSITIONS (diapo) ── */
section{position:relative}
.sec-transition{position:absolute;bottom:-2px;left:0;right:0;height:120px;z-index:10;pointer-events:none}

/* ── SCROLL REVEAL ── */
.rv{opacity:0;transform:translateY(40px);transition:opacity 0.9s cubic-bezier(0.16,1,0.3,1),transform 0.9s cubic-bezier(0.16,1,0.3,1)}
.rv.go{opacity:1;transform:none}
.rv-l{opacity:0;transform:translateX(-40px);transition:opacity 0.9s cubic-bezier(0.16,1,0.3,1),transform 0.9s cubic-bezier(0.16,1,0.3,1)}
.rv-l.go{opacity:1;transform:none}
.rv-r{opacity:0;transform:translateX(40px);transition:opacity 0.9s cubic-bezier(0.16,1,0.3,1),transform 0.9s cubic-bezier(0.16,1,0.3,1)}
.rv-r.go{opacity:1;transform:none}

/* ── HERO ── */
.hero{position:relative;height:100svh;min-height:700px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.hero-bg{position:absolute;inset:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;object-position:center top;animation:hZoom 12s ease forwards}
@keyframes hZoom{from{transform:scale(1.08)}to{transform:scale(1)}}
.hero-grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,8,7,0.2) 0%,rgba(10,8,7,0) 25%,rgba(10,8,7,0.5) 65%,rgba(10,8,7,0.97) 100%)}
.hero-content{position:relative;z-index:2;padding:0 56px 116px}
@media(max-width:640px){.hero-content{padding:0 28px 130px}}
.hero-logo-wrap{display:flex;align-items:center;gap:18px;margin-bottom:44px;opacity:0;animation:fUp 1s 0.2s cubic-bezier(0.16,1,0.3,1) forwards}
.hero-tag{font-size:9px;font-weight:300;letter-spacing:0.42em;color:${C.or};text-transform:uppercase;margin-bottom:20px;opacity:0;animation:fUp 1s 0.5s cubic-bezier(0.16,1,0.3,1) forwards}
.hero-h1{font-family:'Cormorant Garamond',serif;font-weight:300;color:${C.blanc};margin-bottom:40px;opacity:0;animation:fUp 1s 0.7s cubic-bezier(0.16,1,0.3,1) forwards}
.hero-h1 em{display:block;font-size:clamp(40px,6.5vw,82px);font-style:italic;line-height:1.05;color:rgba(250,246,240,0.7)}
.hero-h1 strong{display:block;font-size:clamp(40px,6.5vw,82px);font-weight:300;line-height:1.05}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap;opacity:0;animation:fUp 1s 0.9s cubic-bezier(0.16,1,0.3,1) forwards}
@keyframes fUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}

/* ── TAG ── */
.tag{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:${C.or};display:flex;align-items:center;gap:14px}
.tag::before,.tag::after{content:'';display:block;height:1px;background:currentColor;width:28px;flex-shrink:0}
.tag.no-aft::after{display:none}

/* ── BTNS ── */
.btn-or{background:${C.or};color:${C.noir};border:none;border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;padding:15px 36px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;text-transform:uppercase;transition:all 0.25s}
.btn-or:hover{background:${C.orClair};transform:translateY(-2px);box-shadow:0 8px 28px rgba(201,169,106,0.35)}
.btn-or:disabled{opacity:0.3;cursor:not-allowed;transform:none;box-shadow:none}
.btn-outline{background:transparent;color:${C.blanc};border:1px solid rgba(250,246,240,0.22);border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.2em;padding:14px 32px;text-decoration:none;display:inline-flex;align-items:center;text-transform:uppercase;transition:all 0.25s}
.btn-outline:hover{border-color:rgba(250,246,240,0.6)}
.btn-outline-dark{background:transparent;color:${C.blanc};border:1px solid rgba(250,246,240,0.2);border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.15em;padding:13px 26px;text-decoration:none;display:inline-flex;align-items:center;text-transform:uppercase;transition:all 0.25s}
.btn-outline-dark:hover{border-color:rgba(250,246,240,0.5)}

/* ── BRAND ── */
.brand-sec{background:${C.creme};position:relative}
.brand-inner{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
@media(max-width:800px){.brand-inner{grid-template-columns:1fr}}
.brand-img-col{position:relative;overflow:hidden;min-height:500px}
.brand-img-col img{width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block;transition:transform 1s cubic-bezier(0.16,1,0.3,1)}
.brand-img-col:hover img{transform:scale(1.03)}
.brand-txt-col{padding:80px 64px;display:flex;flex-direction:column;justify-content:center;background:${C.creme}}
@media(max-width:800px){.brand-txt-col{padding:56px 32px}}
.brand-h{font-family:'Cormorant Garamond',serif;font-size:clamp(52px,7vw,88px);font-weight:300;line-height:1;color:${C.noir};white-space:pre-line;margin:20px 0 28px}
.brand-p{font-size:13px;font-weight:300;line-height:1.9;color:${C.taupe};max-width:42ch;margin-bottom:32px}
.brand-kws{display:flex;flex-direction:column;gap:9px;margin-bottom:36px}
.brand-kw-item{font-size:9px;font-weight:500;letter-spacing:0.3em;color:${C.orFonce};text-transform:uppercase}

/* ── SERVICES — alternance full bleed ── */
.svc-sec{position:relative}
.svc-header{text-align:center;padding:90px 48px 72px;background:${C.noir}}
.svc-header-h{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,5vw,60px);font-weight:300;color:${C.blanc};margin-top:20px}
.svc-row{display:grid;grid-template-columns:1fr 1fr;min-height:580px}
@media(max-width:768px){.svc-row{grid-template-columns:1fr}}
.svc-row.rev .svc-img-col{order:2}.svc-row.rev .svc-txt-col{order:1}
@media(max-width:768px){.svc-row.rev .svc-img-col,.svc-row.rev .svc-txt-col{order:unset}}
.svc-img-col{position:relative;overflow:hidden;min-height:400px}
.svc-img-col img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transition:transform 0.9s cubic-bezier(0.16,1,0.3,1)}
.svc-img-col:hover img{transform:scale(1.05)}
.svc-txt-col{padding:72px 60px;display:flex;flex-direction:column;justify-content:center}
@media(max-width:768px){.svc-txt-col{padding:48px 32px}}
.svc-num{font-family:'Cormorant Garamond',serif;font-size:80px;font-weight:300;color:rgba(201,169,106,0.08);line-height:1;margin-bottom:-12px}
.svc-cat-tag{font-size:9px;font-weight:600;letter-spacing:0.35em;color:${C.or};margin-bottom:12px;text-transform:uppercase}
.svc-title{font-family:'Cormorant Garamond',serif;font-size:clamp(32px,4vw,50px);font-weight:300;color:${C.blanc};margin-bottom:10px}
.svc-kwtxt{font-size:8px;font-weight:400;letter-spacing:0.28em;color:rgba(201,169,106,0.5);text-transform:uppercase;margin-bottom:24px}
.svc-desc{font-size:13px;font-weight:300;line-height:1.85;color:rgba(250,246,240,0.5);margin-bottom:28px;max-width:38ch}
.svc-list{display:flex;flex-direction:column;gap:10px;margin-bottom:40px}
.svc-list-item{display:flex;align-items:center;gap:12px;font-size:12px;font-weight:300;color:rgba(250,246,240,0.6);letter-spacing:0.03em}
.svc-list-item::before{content:'';width:16px;height:1px;background:${C.or};flex-shrink:0}
.svc-list-item .devis-badge{font-size:9px;font-weight:500;letter-spacing:0.1em;color:${C.or};margin-left:6px;opacity:0.7}

/* ── TRANSITION DIAPO entre sections ── */
.wave-transition{width:100%;overflow:hidden;line-height:0;display:block}
.wave-transition svg{display:block;width:100%}

/* ── MOODBOARD ── */
.mood-sec{display:flex;gap:3px;overflow:hidden;background:${C.noir}}
.mood-item{flex:1;min-width:140px;position:relative;overflow:hidden;cursor:pointer}
.mood-item img{width:100%;aspect-ratio:2/3;object-fit:cover;object-position:top;display:block;transition:transform 0.7s cubic-bezier(0.16,1,0.3,1),filter 0.4s;filter:brightness(0.65) saturate(0.8)}
.mood-item:hover img{transform:scale(1.06);filter:brightness(0.85) saturate(1)}
.mood-over{position:absolute;bottom:0;left:0;right:0;padding:18px 14px;background:linear-gradient(to top,rgba(10,8,7,0.88) 0%,transparent 100%)}
.mood-label{font-size:8px;font-weight:500;letter-spacing:0.3em;color:${C.or};text-transform:uppercase;margin-bottom:3px}
.mood-name{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:300;color:${C.blanc}}

/* ── BA ── */
.ba-sec{background:${C.creme};padding:110px 52px;position:relative}
@media(max-width:640px){.ba-sec{padding:72px 28px}}
.ba-h{font-family:'Cormorant Garamond',serif;font-size:clamp(44px,6vw,72px);font-weight:300;color:${C.noir};white-space:pre-line;margin:20px 0 64px;line-height:0.95}
.ba-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:640px){.ba-grid{grid-template-columns:1fr}}
.ba-lbl{font-size:9px;font-weight:600;letter-spacing:0.3em;color:${C.orFonce};text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:10px}
.ba-lbl::before{content:'';width:20px;height:1px;background:currentColor}
.ba-slider{position:relative;border-radius:20px;overflow:hidden;cursor:col-resize;user-select:none;touch-action:none;box-shadow:0 20px 60px rgba(10,8,7,0.15)}
.ba-img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
.ba-after{position:absolute;inset:0;overflow:hidden}
.ba-after img{width:100%;height:100%;object-fit:cover}
.ba-line{position:absolute;top:0;bottom:0;width:2px;background:${C.blanc}}
.ba-handle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;background:${C.blanc};display:flex;align-items:center;justify-content:center;color:${C.noir};font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,0.2)}
.ba-ends{display:flex;justify-content:space-between;margin-top:10px}
.ba-end{font-size:9px;letter-spacing:0.25em;color:${C.taupe};text-transform:uppercase}

/* ── BOOK CTA ── */
.book-sec{background:${C.noir};padding:130px 52px;text-align:center;position:relative;overflow:hidden}
.book-sec::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 100%,rgba(201,169,106,0.05) 0%,transparent 70%);pointer-events:none}
.book-h{font-family:'Cormorant Garamond',serif;font-size:clamp(52px,8vw,96px);font-weight:300;color:${C.blanc};white-space:pre-line;line-height:0.95;margin:20px 0 24px}
.book-sub{font-size:13px;font-weight:300;color:rgba(250,246,240,0.4);line-height:1.8;max-width:42ch;margin:0 auto 48px}

/* ── CONTACT ── */
.contact-sec{background:${C.brun};padding:110px 52px}
@media(max-width:640px){.contact-sec{padding:72px 28px}}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:96px;max-width:1000px;margin:0 auto}
@media(max-width:768px){.contact-grid{grid-template-columns:1fr;gap:56px}}
.contact-h{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:300;color:${C.blanc};margin:20px 0 6px}
.contact-sub{font-size:9px;letter-spacing:0.22em;color:rgba(250,246,240,0.25);text-transform:uppercase;margin-bottom:44px}
.ci{margin-bottom:26px}
.ci-l{font-size:8px;font-weight:600;letter-spacing:0.28em;color:${C.or};text-transform:uppercase;margin-bottom:5px}
.ci-v{font-size:13px;font-weight:300;color:rgba(250,246,240,0.65);line-height:1.6}
.contact-btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:36px}
.map-box{border-radius:20px;overflow:hidden;position:relative}
.map-box iframe{width:100%;aspect-ratio:1;display:block;border:none;filter:grayscale(0.3) brightness(0.85)}
.social-row{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap}
.social-link{display:flex;align-items:center;gap:8px;padding:10px 18px;border:1px solid rgba(250,246,240,0.15);border-radius:100px;text-decoration:none;transition:all 0.2s;color:rgba(250,246,240,0.55);font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.1em}
.social-link:hover{border-color:${C.or};color:${C.or}}
.social-icon{font-size:14px}

/* ── FOOTER ── */
.footer{background:${C.noir};border-top:1px solid rgba(201,169,106,0.08);padding:64px 52px 48px}
@media(max-width:640px){.footer{padding:48px 28px 40px}}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:40px;margin-bottom:48px}
.footer-links{display:flex;gap:28px;flex-wrap:wrap}
.footer-links a{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;letter-spacing:0.08em;color:rgba(250,246,240,0.22);text-decoration:none;transition:color 0.2s}
.footer-links a:hover{color:${C.or}}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(250,246,240,0.05);padding-top:24px;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:10px;font-weight:300;color:rgba(250,246,240,0.15)}

/* ── MODAL ── */
.modal-back{position:fixed;inset:0;background:rgba(5,4,3,0.88);backdrop-filter:blur(14px);z-index:700;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:640px){.modal-back{align-items:center}}
.modal{background:${C.blanc};border-radius:28px 28px 0 0;width:100%;max-width:520px;max-height:93svh;overflow-y:auto;padding:36px 32px 52px;animation:mUp 0.4s cubic-bezier(0.16,1,0.3,1)}
@media(min-width:640px){.modal{border-radius:28px}}
@keyframes mUp{from{opacity:0;transform:translateY(32px) scale(0.98)}to{opacity:1;transform:none}}
.steps-bar{display:flex;gap:4px;margin-bottom:28px}
.step-seg{flex:1;height:2px;border-radius:2px;background:#E0D5C5;transition:background 0.35s}
.step-seg.done{background:${C.or}}
.modal-h{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:${C.noir};margin-bottom:4px}
.modal-sub{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.22em;color:${C.taupe};text-transform:uppercase;margin-bottom:28px}

.f-lbl{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${C.taupe};margin-bottom:7px;display:block}
.f-in{width:100%;padding:13px 16px;border:1.5px solid #DDD0BE;border-radius:14px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;background:white;color:${C.noir};outline:none;transition:border-color 0.2s;margin-bottom:14px}
.f-in:focus{border-color:${C.nude}}
.f-in.required-err{border-color:#E88;}
.f-textarea{width:100%;padding:13px 16px;border:1.5px solid #DDD0BE;border-radius:14px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;background:white;color:${C.noir};outline:none;resize:vertical;min-height:88px;margin-bottom:14px;transition:border-color 0.2s}
.f-textarea:focus{border-color:${C.nude}}
.f-textarea.required-err{border-color:#E88;}

.cat-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.cat-tab{padding:8px 16px;border-radius:100px;border:1.5px solid #DDD0BE;background:white;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.1em;color:${C.taupe};transition:all 0.2s;text-transform:uppercase}
.cat-tab.on{background:${C.noir};border-color:${C.noir};color:${C.blanc}}

.svc-pick-list{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.svc-pick-item{display:flex;align-items:center;gap:14px;padding:13px 16px;border:1.5px solid #DDD0BE;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;text-align:left;width:100%}
.svc-pick-item:hover,.svc-pick-item.on{border-color:${C.nude};background:#FBF5EE}
.radio-dot{width:18px;height:18px;border-radius:50%;border:2px solid #C5B8A5;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.svc-pick-item.on .radio-dot{background:${C.or};border-color:${C.or}}
.svc-pick-item.on .radio-dot::after{content:'';width:6px;height:6px;border-radius:50%;background:white}
.pick-name{font-size:13px;font-weight:400;color:${C.noir}}
.pick-devis{font-size:9px;color:${C.or};margin-left:6px;font-weight:500;letter-spacing:0.08em}

.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.cal-nav{background:transparent;border:1.5px solid #DDD0BE;border-radius:10px;width:32px;height:32px;cursor:pointer;font-size:14px;color:${C.taupe};display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.cal-nav:hover{border-color:${C.nude};color:${C.noir}}
.cal-month-lbl{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;color:${C.noir};text-transform:capitalize}
.cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:5px}
.cal-dow-lbl{text-align:center;font-size:9px;font-weight:600;letter-spacing:0.08em;color:${C.taupe};padding:3px 0;text-transform:uppercase}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:18px}
.cal-day{width:100%;aspect-ratio:1;border-radius:10px;border:none;background:transparent;cursor:default;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:300;color:#C0B09A;display:flex;align-items:center;justify-content:center}
.cal-day.avail{background:#FBF5EE;color:${C.noir};cursor:pointer;border:1.5px solid transparent;transition:all 0.15s}
.cal-day.avail:hover{border-color:${C.nude}}
.cal-day.sel{background:${C.noir};color:${C.blanc};border-color:${C.noir}}
.slots-wrap{margin-bottom:6px}
.slots-lbl{font-size:9px;font-weight:600;letter-spacing:0.18em;color:${C.taupe};text-transform:uppercase;margin-bottom:10px}
.slots-grid{display:flex;flex-wrap:wrap;gap:7px}
.slot-btn{padding:8px 15px;border-radius:100px;border:1.5px solid #DDD0BE;background:white;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;color:${C.noir};transition:all 0.15s}
.slot-btn:hover{border-color:${C.nude}}
.slot-btn.on{background:${C.noir};border-color:${C.noir};color:${C.blanc}}
.cal-note{font-size:10px;color:${C.taupe};margin-top:10px;line-height:1.6;font-weight:300}

.health-list{display:flex;flex-direction:column;gap:9px;margin-bottom:14px}
.h-item{display:flex;align-items:center;gap:12px;cursor:pointer;padding:9px 12px;border-radius:12px;transition:background 0.15s}
.h-item:hover{background:#FBF5EE}
.h-check{width:17px;height:17px;accent-color:${C.nude};cursor:pointer;flex-shrink:0}
.h-label{font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;color:${C.noir}}

.ci-alert{background:#FFFBF0;border:1.5px solid ${C.orFonce};border-radius:16px;padding:16px;margin-bottom:14px}
.ci-alert-h{font-size:11px;font-weight:600;color:${C.orFonce};margin-bottom:8px;font-family:'Montserrat',sans-serif}
.ci-alert-p{font-size:12px;font-weight:300;color:#7A5C2A;line-height:1.65;font-family:'Montserrat',sans-serif}
.ci-items{margin:8px 0;font-size:12px;color:#8A6030;font-family:'Montserrat',sans-serif;font-weight:400}
.ci-items li{margin-left:16px;margin-top:4px}

.pay-list{display:flex;flex-direction:column;gap:9px;margin-bottom:14px}
.pay-opt{display:flex;align-items:flex-start;gap:14px;padding:15px;border:1.5px solid #DDD0BE;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;text-align:left;width:100%}
.pay-opt:hover,.pay-opt.on{border-color:${C.nude};background:#FBF5EE}
.pay-name{font-size:13px;font-weight:500;color:${C.noir};margin-bottom:3px}
.pay-desc{font-size:11px;font-weight:300;color:${C.taupe};line-height:1.5;font-family:'Montserrat',sans-serif}

.modal-foot{display:flex;gap:10px;margin-top:22px}
.btn-prev-m{background:transparent;border:1.5px solid #DDD0BE;border-radius:100px;padding:12px 20px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:400;cursor:pointer;color:${C.taupe};transition:border-color 0.2s;letter-spacing:0.1em}
.btn-prev-m:hover{border-color:${C.nude}}

.recap-box{background:#FBF5EE;border-radius:16px;padding:14px 16px;margin-bottom:16px}
.recap-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #EAE0D0;font-family:'Montserrat',sans-serif;font-size:12px}
.recap-row:last-child{border-bottom:none}
.recap-lbl{color:${C.taupe}}
.recap-val{color:${C.noir};font-weight:400}
`

// ─── LOGO ──────────────────────────────────────────────────────
function LogoMark({ size = 80, light = false }: { size?: number; light?: boolean }) {
  const s = light ? 'rgba(250,246,240,0.85)' : 'url(#gld)'
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <defs>
        <linearGradient id="gld" x1="50" y1="10" x2="150" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2C07A"/>
          <stop offset="50%" stopColor="#C9A96A"/>
          <stop offset="100%" stopColor="#9A7840"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="93" stroke={s} strokeWidth="1.2" fill="none"/>
      <circle cx="100" cy="100" r="87" stroke={s} strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M63 158 L96 35" stroke={s} strokeWidth="3" strokeLinecap="round"/>
      <path d="M137 158 L96 35" stroke={s} strokeWidth="13" strokeLinecap="round" opacity="0.88"/>
      <path d="M115 55 C119 60,123 68,121 78 C119 87,114 91,117 100 C119 107,121 110,119 117" stroke={s} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M117 100 C115 104,113 107,115 110" stroke={s} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M73 120 L127 120" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M63 158 C56 162,44 158,47 150 C50 142,62 145,68 140 C74 135,72 127,62 129" stroke={s} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function LogoWordmark({ color = C.blanc, scale = 1 }: { color?: string; scale?: number }) {
  return (
    <div style={{ lineHeight: 1 }}>
      <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24*scale, fontWeight:300, color, letterSpacing:'0.22em', textTransform:'uppercase' }}>ADORÉA</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:8*scale, fontWeight:300, color, letterSpacing:'0.22em', textTransform:'uppercase', marginTop:4*scale, opacity:0.6 }}>PMU & MAKEUP PRO</div>
    </div>
  )
}

// ─── WAVE TRANSITION ───────────────────────────────────────────
function Wave({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  return (
    <div style={{ background: fromColor, lineHeight: 0, marginBottom: -1 }}>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%' }}>
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill={toColor}/>
      </svg>
    </div>
  )
}

function WaveUp({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  return (
    <div style={{ background: toColor, lineHeight: 0, marginTop: -1 }}>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%' }}>
        <path d="M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,0 L0,0 Z" fill={fromColor}/>
      </svg>
    </div>
  )
}

// ─── BA SLIDER ─────────────────────────────────────────────────
function BASlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const move = useCallback((x: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.min(95, Math.max(5, ((x - r.left) / r.width) * 100)))
  }, [])
  useEffect(() => {
    const up = () => { drag.current = false }
    const mm = (e: MouseEvent) => { if (drag.current) move(e.clientX) }
    const tm = (e: TouchEvent) => { if (drag.current) move(e.touches[0].clientX) }
    window.addEventListener('mouseup', up); window.addEventListener('mousemove', mm)
    window.addEventListener('touchend', up); window.addEventListener('touchmove', tm)
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', mm); window.removeEventListener('touchend', up); window.removeEventListener('touchmove', tm) }
  }, [move])
  return (
    <div className="ba-slider" ref={ref}
      onMouseDown={e => { drag.current = true; move(e.clientX) }}
      onTouchStart={e => { drag.current = true; move(e.touches[0].clientX) }}>
      <img className="ba-img" src={before} alt="avant" />
      <div className="ba-after" style={{ clipPath:`inset(0 ${100-pos}% 0 0)` }}><img src={after} alt="après" /></div>
      <div className="ba-line" style={{ left:`${pos}%` }}><div className="ba-handle">⟺</div></div>
    </div>
  )
}

// ─── SCROLL REVEAL ─────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('go'); obs.unobserve(e.target) } }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.rv,.rv-l,.rv-r').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── BOOKING MODAL ─────────────────────────────────────────────
function BookingModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = T[lang]
  const [step, setStep]       = useState(0)
  const [selCat, setCat]      = useState<string | null>(null)
  const [selSvc, setSvc]      = useState<{ name: string; devis: boolean } | null>(null)
  const [selDate, setDate]    = useState<string | null>(null)
  const [selSlot, setSlot]    = useState<string | null>(null)
  const [form, setForm]       = useState({ prenom:'', nom:'', tel:'', dob:'', notes:'' })
  const [health, setHealth]   = useState<boolean[]>(new Array(HEALTH_ITEMS.FR.length).fill(false))
  const [healthNotes, setHN]  = useState('')
  const [payMethod, setPay]   = useState<string | null>(null)
  const [errors, setErrors]   = useState<Record<string, boolean>>({})

  const checkedItems = HEALTH_ITEMS[lang].filter((_, i) => health[i])
  const hasCI = health.some(Boolean)

  const now = new Date()
  const [calYear, setCalYear]   = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const todayStr = now.toISOString().split('T')[0]
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate()
  const DAYS = ['L','M','M','J','V','S','D']
  const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

  const cats = [...new Set(SERVICES.map(s => s.cat))]
  const filteredSvcs = selCat ? SERVICES.filter(s => s.cat === selCat) : SERVICES

  const WA = '25377596159'

  function buildWAMsg() {
    const svcName = selSvc?.name || '—'
    const isDevis = selSvc?.devis
    let msg = `Bonjour ADORÉA ✨\n\nJe souhaite réserver une prestation.\n\n`
    msg += `━━ PRESTATION ━━\n${svcName}${isDevis ? '\n⚠️ Prestation sur devis — en attente de votre estimation tarifaire.' : ''}\n\n`
    msg += `━━ DATE SOUHAITÉE ━━\n${selDate} à ${selSlot}\n\n`
    msg += `━━ MES COORDONNÉES ━━\nPrénom : ${form.prenom}\nNom : ${form.nom}\nTéléphone : ${form.tel}\n${form.dob ? `Date de naissance : ${form.dob}\n` : ''}`
    if (form.notes) msg += `\n━━ INFORMATIONS COMPLÉMENTAIRES ━━\n${form.notes}\n`
    if (hasCI) {
      msg += `\n━━ INFORMATIONS SANTÉ ━━\n⚠️ J'ai des contre-indications à signaler :\n`
      checkedItems.forEach(item => { msg += `• ${item}\n` })
      if (healthNotes) msg += `\nPrécisions : ${healthNotes}\n`
      msg += `\nMon rendez-vous nécessite votre validation avant confirmation définitive.\n`
    }
    if (payMethod) {
      msg += `\n━━ MODE DE PAIEMENT ━━\n${payMethod}\n`
      if (payMethod !== 'CASH') msg += `Capture de paiement jointe ci-dessous.\n`
    }
    msg += `\nMerci de confirmer ma réservation ! 🙏`
    return msg
  }

  function validateStep(s: number): boolean {
    const errs: Record<string, boolean> = {}
    if (s === 0 && !selSvc) return false
    if (s === 1 && (!selDate || !selSlot)) return false
    if (s === 2) {
      if (!form.prenom) errs.prenom = true
      if (!form.nom) errs.nom = true
      if (!form.tel) errs.tel = true
      if (Object.keys(errs).length > 0) { setErrors(errs); return false }
    }
    if (s === 3 && hasCI && !healthNotes) { setErrors({ healthNotes: true }); return false }
    setErrors({})
    return true
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => s + 1)
  }

  function handleReserve() {
    // Ouvre WA avec tous les infos + paiement
    const msg = buildWAMsg()
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const PAY_OPTIONS = [
    { key:'CAC PAY',  desc: lang==='FR' ? 'Effectuez le paiement via CAC PAY puis envoyez la capture d\'écran par WhatsApp pour confirmer votre réservation.' : 'Pay via CAC PAY and send the screenshot via WhatsApp.' },
    { key:'WAAFI',    desc: lang==='FR' ? 'Payez sur WAAFI et envoyez la preuve de paiement par WhatsApp.' : 'Pay via WAAFI and send the receipt via WhatsApp.' },
    { key:'D-MONEY',  desc: lang==='FR' ? 'Utilisez D-Money pour régler et partagez la capture par WhatsApp.' : 'Pay via D-Money and share the receipt via WhatsApp.' },
    { key:'CASH',     desc: lang==='FR' ? 'Le paiement en espèces est possible uniquement pour les clientes ayant déjà réalisé au moins une prestation chez ADORÉA.' : 'Cash is available only for returning clients with at least one previous appointment.' },
  ]

  const canNext = [
    !!selSvc,
    !!(selDate && selSlot),
    true,
    true,
    !!payMethod,
  ][step]

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="steps-bar">{t.book_step.map((_, i) => <div key={i} className={`step-seg${i<=step?' done':''}`}/>)}</div>
        <h2 className="modal-h">{t.book_step[step]}</h2>
        <p className="modal-sub">ADORÉA · {t.cert}</p>

        {/* STEP 0 — Prestation */}
        {step === 0 && (
          <>
            <div className="cat-tabs">
              {cats.map(c => (
                <button key={c} className={`cat-tab${selCat===c?' on':''}`}
                  onClick={() => { setCat(selCat===c ? null : c); setSvc(null) }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="svc-pick-list">
              {filteredSvcs.flatMap(s => s.items.map(item => (
                <button key={item.name} className={`svc-pick-item${selSvc?.name===item.name?' on':''}`}
                  onClick={() => setSvc(item)}>
                  <div className="radio-dot"/>
                  <div>
                    <span className="pick-name">{item.name}</span>
                    {item.devis && <span className="pick-devis">· Sur devis</span>}
                    <div style={{ fontSize:10, color:C.taupe, marginTop:2 }}>{s.label[lang]}</div>
                  </div>
                </button>
              )))}
            </div>
          </>
        )}

        {/* STEP 1 — Calendrier */}
        {step === 1 && (
          <>
            <div className="cal-header">
              <button className="cal-nav" onClick={() => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1) }}>‹</button>
              <span className="cal-month-lbl">
                {new Date(calYear, calMonth, 1).toLocaleDateString(lang==='AR'?'ar':lang==='EN'?'en-US':'fr-FR',{month:'long',year:'numeric'})}
              </span>
              <button className="cal-nav" onClick={() => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1) }}>›</button>
            </div>
            <div className="cal-dow">{DAYS.map((d,i) => <div key={i} className="cal-dow-lbl">{d}</div>)}</div>
            <div className="cal-grid">
              {Array.from({length:offset}).map((_,i) => <div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i) => {
                const d = i+1
                const str = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const isPast = str < todayStr
                return (
                  <button key={d}
                    className={`cal-day${!isPast?' avail':''}${selDate===str?' sel':''}`}
                    onClick={() => !isPast && setDate(str)}
                    disabled={isPast}>
                    {d}
                  </button>
                )
              })}
            </div>
            {selDate && (
              <div className="slots-wrap">
                <div className="slots-lbl">{lang==='AR'?'الأوقات المتاحة':lang==='EN'?'Available slots':'Créneaux disponibles'}</div>
                <div className="slots-grid">
                  {SLOTS.map(s => <button key={s} className={`slot-btn${selSlot===s?' on':''}`} onClick={() => setSlot(s)}>{s}</button>)}
                </div>
              </div>
            )}
            <div className="cal-note">
              {lang==='FR'?'* Les créneaux sont indicatifs. Votre experte confirmera le créneau définitif sous 24h.':
               lang==='EN'?'* Slots are indicative. Your expert confirms the final time within 24h.':
               '* المواعيد استرشادية. ستؤكد خبيرتك الموعد النهائي خلال 24 ساعة.'}
            </div>
          </>
        )}

        {/* STEP 2 — Identité + Notes */}
        {step === 2 && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label className="f-lbl">{lang==='AR'?'الاسم الأول':lang==='EN'?'First name':'Prénom *'}</label>
                <input className={`f-in${errors.prenom?' required-err':''}`} value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))} />
              </div>
              <div>
                <label className="f-lbl">{lang==='AR'?'اللقب':lang==='EN'?'Last name':'Nom *'}</label>
                <input className={`f-in${errors.nom?' required-err':''}`} value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} />
              </div>
            </div>
            <label className="f-lbl">{lang==='AR'?'الهاتف':lang==='EN'?'Phone *':'Téléphone *'}</label>
            <input className={`f-in${errors.tel?' required-err':''}`} type="tel" placeholder="+253..." value={form.tel} onChange={e => setForm(f=>({...f,tel:e.target.value}))} />
            <label className="f-lbl">{lang==='AR'?'تاريخ الميلاد':lang==='EN'?'Date of birth':'Date de naissance'}</label>
            <input className="f-in" type="date" value={form.dob} onChange={e => setForm(f=>({...f,dob:e.target.value}))} />
            <label className="f-lbl">{lang==='AR'?'ملاحظات':lang==='EN'?'Notes / Additional info':'Notes / Informations complémentaires'}</label>
            <textarea className="f-textarea" placeholder={lang==='FR'?'Informations complémentaires, demandes spéciales...':lang==='EN'?'Additional info, special requests...':'معلومات إضافية، طلبات خاصة...'} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
          </>
        )}

        {/* STEP 3 — Santé */}
        {step === 3 && (
          <>
            <p style={{fontSize:12,fontWeight:300,color:C.taupe,lineHeight:1.7,marginBottom:18,fontFamily:'Montserrat,sans-serif'}}>
              {lang==='FR'?'Indiquez si vous êtes concernée par l\'une des situations suivantes :':
               lang==='EN'?'Indicate if any of the following apply to you :':
               'يرجى الإشارة إلى ما ينطبق عليكِ :'}
            </p>
            <div className="health-list">
              {HEALTH_ITEMS[lang].map((item, i) => (
                <label key={i} className="h-item">
                  <input type="checkbox" className="h-check" checked={health[i]}
                    onChange={e => setHealth(h => h.map((v,j) => j===i ? e.target.checked : v))} />
                  <span className="h-label">{item}</span>
                </label>
              ))}
            </div>

            {hasCI && (
              <div className="ci-alert">
                <div className="ci-alert-h">ℹ️ {lang==='FR'?'Contre-indications signalées':lang==='EN'?'Reported contra-indications':'موانع مُشار إليها'}</div>
                <div className="ci-alert-p">
                  {lang==='FR'?'Vous avez coché :':lang==='EN'?'You checked:':'لقد حددتِ :'}
                  <ul className="ci-items">{checkedItems.map((c,i) => <li key={i}>{c}</li>)}</ul>
                  {lang==='FR'?'Votre rendez-vous ne sera pas automatiquement confirmé. Votre experte vous contactera pour valider votre réservation avant confirmation définitive.':
                   lang==='EN'?'Your appointment will not be automatically confirmed. Your expert will contact you to validate the booking before final confirmation.':
                   'لن يتم تأكيد موعدك تلقائيًا. ستتواصل معكِ خبيرتك للتحقق قبل التأكيد النهائي.'}
                </div>
              </div>
            )}

            {hasCI && (
              <>
                <label className="f-lbl" style={{color: errors.healthNotes ? '#E88' : undefined}}>
                  {lang==='FR'?'Précisez vos contre-indications *':lang==='EN'?'Please describe your contra-indications *':'يرجى توضيح موانعك *'}
                </label>
                <textarea className={`f-textarea${errors.healthNotes?' required-err':''}`}
                  placeholder={lang==='FR'?'Décrivez en détail vos contre-indications, traitements en cours, allergies connues...':lang==='EN'?'Describe in detail...':'وصف تفصيلي...'}
                  value={healthNotes} onChange={e => setHN(e.target.value)} />
              </>
            )}
          </>
        )}

        {/* STEP 4 — Paiement */}
        {step === 4 && (
          <>
            {/* Récap */}
            <div className="recap-box">
              {[
                {l:lang==='FR'?'Soin':lang==='EN'?'Service':'الخدمة', v:selSvc?.name},
                {l:'Date', v:selDate ? `${selDate} · ${selSlot}` : '—'},
                {l:lang==='FR'?'Cliente':lang==='EN'?'Client':'العميلة', v:`${form.prenom} ${form.nom}`},
              ].map(r => (
                <div key={r.l} className="recap-row">
                  <span className="recap-lbl">{r.l}</span>
                  <span className="recap-val">{r.v}</span>
                </div>
              ))}
            </div>

            {selSvc?.devis && (
              <div style={{background:'#FBF5EE',border:`1px solid ${C.or}`,borderRadius:12,padding:'12px 14px',marginBottom:14,fontSize:12,color:C.taupe,fontFamily:'Montserrat,sans-serif',fontWeight:300,lineHeight:1.6}}>
                ℹ️ {lang==='FR'?'Cette prestation est sur devis. Votre experte vous communiquera le tarif lors de la confirmation.':'This service is priced on a case-by-case basis. Your expert will share the price upon confirmation.'}
              </div>
            )}

            <p style={{fontSize:11,fontWeight:300,color:C.taupe,lineHeight:1.7,marginBottom:16,fontFamily:'Montserrat,sans-serif'}}>
              {lang==='FR'?'Sélectionnez votre mode de paiement, puis cliquez sur "Réserver" pour envoyer votre demande via WhatsApp.':
               lang==='EN'?'Select your payment method, then click "Book" to send your request via WhatsApp.':
               'اختاري طريقة الدفع، ثم اضغطي على "احجزي" لإرسال طلبك عبر واتساب.'}
            </p>

            <div className="pay-list">
              {PAY_OPTIONS.map(opt => (
                <button key={opt.key} className={`pay-opt${payMethod===opt.key?' on':''}`}
                  onClick={() => setPay(opt.key)}>
                  <div className="radio-dot" style={payMethod===opt.key?{background:C.or,borderColor:C.or}:{}}/>
                  <div>
                    <div className="pay-name">{opt.key}</div>
                    <div className="pay-desc">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="modal-foot">
          {step > 0 && <button className="btn-prev-m" onClick={() => setStep(s=>s-1)}>{t.prev}</button>}
          {step < 4 && (
            <button className="btn-or" style={{flex:1,opacity:canNext?1:0.3,cursor:canNext?'pointer':'not-allowed'}}
              onClick={nextStep} disabled={!canNext}>
              {t.next}
            </button>
          )}
          {step === 4 && (
            <button className="btn-or" style={{flex:1,opacity:payMethod?1:0.3,cursor:payMethod?'pointer':'not-allowed'}}
              onClick={handleReserve} disabled={!payMethod}>
              {lang==='FR'?'Réserver via WhatsApp 💬':lang==='EN'?'Book via WhatsApp 💬':'احجزي عبر واتساب 💬'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang]   = useState<Lang>('FR')
  const [waOn, setWaOn]   = useState(true)
  const [booking, setBooking] = useState(false)
  const t = T[lang]
  const dir = lang === 'AR' ? 'rtl' : 'ltr'
  useReveal()

  const SOCIAL = [
    { name:'Instagram', icon:'📷', url:'https://www.instagram.com/adorea.dj?utm_source=qr&stkn=dzFvMGlsd2djeTgx' },
    { name:'Facebook',  icon:'👍', url:'https://www.facebook.com/share/1FeC3VJB82/' },
    { name:'TikTok',    icon:'🎵', url:'https://www.tiktok.com/@adorea.dj?_r=1&_t=ZS-99ct94BI1J9' },
    { name:'Snapchat',  icon:'👻', url:'https://www.snapchat.com/add/adorea.dj?share_id=ojG8RTvtwYI&locale=fr-BE' },
  ]

  const moodItems = [
    { img:'/images/hero-main.png',     label:'STUDIO',   name:'ADORÉA' },
    { img:'/images/sourcils-mirror.png',label:'PMU',     name:'Sourcils' },
    { img:'/images/levres-closeup.png', label:'PMU',     name:'Lèvres' },
    { img:'/images/makeup-profile.png', label:'MAKEUP',  name:'Makeup Pro' },
    { img:'/images/nails-hero.png',     label:'NAILS',   name:'Nails' },
  ]

  // Section backgrounds sequence
  const svcBgs = SERVICES.map(s => s.bg)

  return (
    <div dir={dir}>
      <style>{CSS}</style>

      {/* ── BOTTOM TOGGLES ── */}
      <div className="bottom-toggles">
        <div className="lang-pill">
          {(['FR','EN','AR'] as Lang[]).map(l => (
            <button key={l} className={lang===l?'on':''} onClick={() => setLang(l)}>{l}</button>
          ))}
        </div>
        <div className="wa-toggle-wrap">
          <span className="wa-toggle-label">WhatsApp</span>
          <div className={`wa-toggle${waOn?' on':''}`} onClick={() => setWaOn(w => !w)}>
            <div className="wa-toggle-knob"/>
          </div>
        </div>
      </div>

      {/* ── ISLAND NAV ── */}
      <nav className="island">
        {t.nav.map((item, i) => (
          <a key={i} href={['#hero','#rdv','#sourcils','#levres','#makeup','#nails','#contact'][i]}>{item}</a>
        ))}
      </nav>

      {/* ── WA FAB ── */}
      <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer"
        className={`wa-fab${waOn?'':' hidden'}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* ══ HERO ══ */}
      <section className="hero" id="hero" style={{ position:'relative' }}>
        <div className="hero-bg"><img src="/images/hero-main.png" alt="ADORÉA" /></div>
        <div className="hero-grad"/>
        <div className="hero-content">
          <div className="hero-logo-wrap">
            <LogoMark size={72} light />
            <LogoWordmark color={C.blanc} scale={0.88} />
          </div>
          <div className="hero-tag">{t.tagline}</div>
          <h1 className="hero-h1">
            <em>{t.h1a}</em>
            <strong>{t.h1b}</strong>
          </h1>
          <div className="hero-btns">
            <button className="btn-or" onClick={() => setBooking(true)}>{t.cta1}</button>
            <a href="#sourcils" className="btn-outline">{t.cta2}</a>
          </div>
        </div>
      </section>

      {/* ══ WAVE HERO → BRAND ══ */}
      <Wave fromColor={C.noir} toColor={C.creme} />

      {/* ══ BRAND ══ */}
      <section className="brand-sec">
        <div className="brand-inner">
          <div className="brand-img-col rv-l">
            <img src="/images/brand-beige.png" alt="ADORÉA Brand" style={{ objectPosition:'center 30%' }} />
          </div>
          <div className="brand-txt-col">
            <div className="tag rv no-aft" style={{ color: C.orFonce }}>{t.brand_tag}</div>
            <h2 className="brand-h rv" style={{ transitionDelay:'0.1s' }}>{t.brand_h}</h2>
            <p className="brand-p rv" style={{ transitionDelay:'0.2s' }}>
              {lang==='FR' ? 'ADORÉA est un studio beauté premium à Djibouti. Spécialisé dans le maquillage permanent, le makeup professionnel et l\'art des ongles, chaque prestation est réalisée avec des pigments certifiés et des techniques maîtrisées en Belgique.' :
               lang==='EN' ? 'ADORÉA is a premium beauty studio in Djibouti. Specialising in permanent makeup, professional beauty and nail artistry — every treatment uses certified pigments and Belgian-certified techniques.' :
               'أدوريا استوديو تجميل فاخر في جيبوتي. كل خدمة تُنفَّذ بأصباغ معتمدة وتقنيات بلجيكية.'}
            </p>
            <div className="brand-kws rv" style={{ transitionDelay:'0.3s' }}>
              {t.brand_kw.map((k,i) => <div key={i} className="brand-kw-item">{k}</div>)}
            </div>
            <div className="rv" style={{ transitionDelay:'0.4s', display:'inline-flex', alignItems:'center', gap:12, padding:'13px 20px', border:`1px solid ${C.orFonce}`, borderRadius:100 }}>
              <LogoMark size={26} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:500, letterSpacing:'0.2em', color:C.taupe, textTransform:'uppercase' }}>{t.cert}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WAVE BRAND → SERVICES ══ */}
      <Wave fromColor={C.creme} toColor={C.noir} />

      {/* ══ SERVICES ══ */}
      <section className="svc-sec" id="services">
        <div className="svc-header">
          <div className="tag rv" style={{ justifyContent:'center' }}>{t.svc_tag}</div>
          <h2 className="svc-header-h rv" style={{ transitionDelay:'0.1s' }}>{t.svc_sub}</h2>
        </div>

        {SERVICES.map((s, idx) => (
          <div key={s.id} id={s.id}>
            {idx > 0 && (
              <div style={{ background: SERVICES[idx-1].bg, lineHeight:0 }}>
                <svg viewBox="0 0 1440 60" style={{display:'block',width:'100%'}}>
                  <path d={`M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z`} fill={s.bg}/>
                </svg>
              </div>
            )}
            <div className={`svc-row${idx%2===1?' rev':''}`} style={{ background: s.bg }}>
              <div className="svc-img-col rv">
                <img src={s.img} alt={s.label[lang]} />
              </div>
              <div className="svc-txt-col" style={{ background: s.bg }}>
                <div className="svc-num rv">{String(idx+1).padStart(2,'0')}</div>
                <div className="svc-cat-tag rv" style={{transitionDelay:'0.05s'}}>{s.cat}</div>
                <h3 className="svc-title rv" style={{transitionDelay:'0.1s'}}>{s.label[lang]}</h3>
                <div className="svc-kwtxt rv" style={{transitionDelay:'0.15s'}}>{s.kw}</div>
                <p className="svc-desc rv" style={{transitionDelay:'0.2s'}}>{s.desc[lang]}</p>
                <div className="svc-list rv" style={{transitionDelay:'0.25s'}}>
                  {s.items.map((item,j) => (
                    <div key={j} className="svc-list-item">
                      {item.name}
                      {item.devis && <span style={{fontSize:9,color:C.or,marginLeft:6,fontWeight:500}}>· Sur devis</span>}
                    </div>
                  ))}
                </div>
                <div className="rv" style={{transitionDelay:'0.3s'}}>
                  <button className="btn-or" onClick={() => setBooking(true)}>
                    {lang==='AR'?'احجزي':lang==='EN'?'Book':'Réserver'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ WAVE SERVICES → MOODBOARD ══ */}
      <Wave fromColor={SERVICES[SERVICES.length-1].bg} toColor={C.noir} />

      {/* ══ MOODBOARD ══ */}
      <section className="mood-sec rv" style={{ paddingBottom:4 }}>
        {moodItems.map((m,i) => (
          <div key={i} className="mood-item">
            <img src={m.img} alt={m.label} />
            <div className="mood-over">
              <div className="mood-label">{m.label}</div>
              <div className="mood-name">{m.name}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ WAVE MOODBOARD → BA ══ */}
      <Wave fromColor={C.noir} toColor={C.creme} />

      {/* ══ BEFORE / AFTER ══ */}
      <section className="ba-sec">
        <div className="tag rv" style={{ color: C.orFonce }}>{t.ba_tag}</div>
        <h2 className="ba-h rv" style={{ transitionDelay:'0.1s' }}>{t.ba_h}</h2>
        <div className="ba-grid">
          {BA.map((item,i) => (
            <div key={i} className="rv" style={{ transitionDelay:`${i*0.15}s` }}>
              <div className="ba-lbl">{item.label}</div>
              <BASlider before={item.before} after={item.after} />
              <div className="ba-ends">
                <span className="ba-end">{t.bef}</span>
                <span className="ba-end">{t.aft}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ WAVE BA → BOOK ══ */}
      <Wave fromColor={C.creme} toColor={C.noir} />

      {/* ══ BOOK CTA ══ */}
      <section className="book-sec" id="rdv">
        <div className="tag rv" style={{ justifyContent:'center' }}>{t.book_tag}</div>
        <h2 className="book-h rv" style={{ transitionDelay:'0.1s' }}>{t.book_h}</h2>
        <p className="book-sub rv" style={{ transitionDelay:'0.2s' }}>{t.book_sub}</p>
        <div className="rv" style={{ transitionDelay:'0.3s' }}>
          <button className="btn-or" onClick={() => setBooking(true)}>{t.book_btn}</button>
        </div>
      </section>

      {/* ══ WAVE BOOK → CONTACT ══ */}
      <Wave fromColor={C.noir} toColor={C.brun} />

      {/* ══ CONTACT ══ */}
      <section className="contact-sec" id="contact">
        <div className="contact-grid">
          <div>
            <div className="tag rv" style={{ color: C.or }}>{t.contact_tag}</div>
            <h2 className="contact-h rv" style={{ transitionDelay:'0.1s' }}>ADORÉA</h2>
            <div className="contact-sub rv" style={{ transitionDelay:'0.15s' }}>PMU & MAKEUP PRO · CERTIFIED BELGIUM</div>
            {[
              { l: lang==='AR'?'العنوان':lang==='EN'?'Address':'Adresse', v:'PK13 – Bâtiment B1-2\nDjibouti Ville' },
              { l: lang==='AR'?'الهاتف':lang==='EN'?'Phone':'Téléphone', v:'+253 77 59 61 59' },
              { l:'Email', v:'adlina@adorea-dj.com' },
              { l: lang==='AR'?'أوقات العمل':lang==='EN'?'Hours':'Horaires', v:t.hours },
            ].map((item,i) => (
              <div key={i} className={`ci rv`} style={{ transitionDelay:`${0.2+i*0.07}s` }}>
                <div className="ci-l">{item.l}</div>
                <div className="ci-v" style={{ whiteSpace:'pre-line' }}>{item.v}</div>
              </div>
            ))}
            <div className="contact-btns rv" style={{ transitionDelay:'0.5s' }}>
              <a href="tel:+25377596159" className="btn-outline-dark">{lang==='AR'?'اتصال':lang==='EN'?'Call':'Appeler'}</a>
              <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="btn-or">WhatsApp</a>
            </div>
            {/* Réseaux sociaux */}
            <div className="social-row rv" style={{ transitionDelay:'0.6s' }}>
              {SOCIAL.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="social-link">
                  <span className="social-icon">{s.icon}</span>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
          <div className="rv-r">
            {/* Google Maps avec vraies coordonnées */}
            <div className="map-box">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.123456789!2d43.076942066923!3d11.570805180053526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDM0JzE0LjkiTiA0M8KwMDQnMzcuMCJF!5e0!3m2!1sfr!2sdj!4v1234567890"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ADORÉA Djibouti"
              />
              <div style={{ position:'absolute', top:8, left:8, background:'rgba(10,8,7,0.85)', color:C.blanc, padding:'6px 12px', borderRadius:100, fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:500, letterSpacing:'0.1em' }}>
                📍 PK13 – Bâtiment B1-2
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WAVE CONTACT → FOOTER ══ */}
      <Wave fromColor={C.brun} toColor={C.noir} />

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-top">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <LogoMark size={52} />
            <LogoWordmark color={C.blanc} scale={0.75} />
          </div>
          <nav className="footer-links">
            {t.nav.map((item,i) => (
              <a key={i} href={['#hero','#rdv','#sourcils','#levres','#makeup','#nails','#contact'][i]}>{item}</a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">{t.rights}</span>
          <div style={{ display:'flex', gap:12 }}>
            {SOCIAL.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ width:34,height:34,borderRadius:'50%',border:'1px solid rgba(250,246,240,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,textDecoration:'none',transition:'all 0.2s',color:'rgba(250,246,240,0.4)' }}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {booking && <BookingModal lang={lang} onClose={() => setBooking(false)} />}
    </div>
  )
}
