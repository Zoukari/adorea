'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── PALETTE ADORÉA — inspirée du moodboard ───────────────────
const C = {
  // Tons chauds extraits du moodboard
  noir:     '#0D0B09',       // noir profond chaud
  brun:     '#2C1F14',       // brun très foncé
  or:       '#C9A96A',       // or du logo
  orClair:  '#E8C97A',       // or clair
  orFonce:  '#A07840',       // or foncé
  creme:    '#F5EDE0',       // crème chaud
  beige:    '#E8D5BC',       // beige rosé
  nude:     '#D4A882',       // nude chaud
  taupe:    '#8B6B52',       // taupe
  blanc:    '#FBF7F2',       // blanc cassé chaud
  textClair:'rgba(251,247,242,0.82)',
  textMuted:'rgba(251,247,242,0.45)',
}

// ─── i18n ──────────────────────────────────────────────────────
type Lang = 'FR' | 'EN' | 'AR'
const T = {
  FR: {
    nav: ['Accueil','Rendez-vous','Sourcils','Lèvres','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    tagline: 'BEAUTY · CONFIDENCE · YOU',
    h1a: 'Plus qu\'un maquillage',
    h1b: 'une meilleure version de toi',
    cta1: 'Réserver maintenant',
    cta2: 'Découvrir',
    brand_tag: 'La beauté de Djibouti aux mains d\'expertes',
    brand_h: 'Art\nBeauté\nConfiance',
    brand_kw: ['ÉLÉGANCE', 'TECHNIQUE', 'BEAUTÉ DURABLE'],
    svc_tag: 'NOS PRESTATIONS',
    svc_sub: 'Expertise & précision — résultats naturels',
    ba_tag: 'AVANT · APRÈS',
    ba_h: 'Les résultats\nparlent d\'eux-mêmes',
    book_tag: 'RÉSERVATION',
    book_h: 'Prenez\nrendez-vous',
    book_sub: 'Choisissez votre soin, votre créneau. Votre experte vous confirme sous 24h.',
    book_btn: 'Réserver un créneau',
    contact_tag: 'NOUS TROUVER',
    hours: 'Lun – Sam · 09h – 19h',
    rights: '© 2025 ADORÉA. Tous droits réservés.',
    bef: 'Avant', aft: 'Après',
    book_step: ['Soin', 'Date & Heure', 'Vos infos', 'Santé', 'Paiement'],
    next: 'Suivant', prev: 'Retour', confirm: 'Confirmer',
  },
  EN: {
    nav: ['Home','Book','Brows','Lips','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    tagline: 'BEAUTY · CONFIDENCE · YOU',
    h1a: 'More than makeup',
    h1b: 'a better version of you',
    cta1: 'Book now',
    cta2: 'Discover',
    brand_tag: 'Djibouti beauty in expert hands',
    brand_h: 'Art\nBeauty\nConfidence',
    brand_kw: ['ELEGANCE', 'TECHNIQUE', 'LASTING BEAUTY'],
    svc_tag: 'OUR SERVICES',
    svc_sub: 'Expertise & precision — natural results',
    ba_tag: 'BEFORE · AFTER',
    ba_h: 'Results\nspeak for themselves',
    book_tag: 'BOOKING',
    book_h: 'Book your\nappointment',
    book_sub: 'Choose your treatment and slot. Your expert confirms within 24h.',
    book_btn: 'Book a slot',
    contact_tag: 'FIND US',
    hours: 'Mon – Sat · 09:00 – 19:00',
    rights: '© 2025 ADORÉA. All rights reserved.',
    bef: 'Before', aft: 'After',
    book_step: ['Service', 'Date & Time', 'Your info', 'Health', 'Payment'],
    next: 'Next', prev: 'Back', confirm: 'Confirm',
  },
  AR: {
    nav: ['الرئيسية','حجز','الحواجب','الشفاه','ميكاب','أظافر','تواصل'],
    cert: 'معتمد بلجيكيًا',
    tagline: 'جمال · ثقة · أنتِ',
    h1a: 'أكثر من مجرد مكياج',
    h1b: 'نسخة أفضل منكِ',
    cta1: 'احجزي الآن',
    cta2: 'اكتشفي',
    brand_tag: 'جمال جيبوتي بأيدي خبيرات',
    brand_h: 'فن\nجمال\nثقة',
    brand_kw: ['أناقة', 'تقنية', 'جمال دائم'],
    svc_tag: 'خدماتنا',
    svc_sub: 'خبرة ودقة — نتائج طبيعية',
    ba_tag: 'قبل · بعد',
    ba_h: 'النتائج\nتتحدث عن نفسها',
    book_tag: 'الحجز',
    book_h: 'احجزي\nموعدك',
    book_sub: 'اختاري خدمتك وموعدك. خبيرتك تؤكد خلال 24 ساعة.',
    book_btn: 'احجزي الآن',
    contact_tag: 'موقعنا',
    hours: 'الإثنين – السبت · ٩ص – ٧م',
    rights: '© 2025 ADORÉA. جميع الحقوق محفوظة.',
    bef: 'قبل', aft: 'بعد',
    book_step: ['الخدمة', 'التاريخ', 'بياناتك', 'الصحة', 'الدفع'],
    next: 'التالي', prev: 'رجوع', confirm: 'تأكيد',
  },
}

// ─── SERVICES ──────────────────────────────────────────────────
const SERVICES = [
  {
    id:'sourcils', cat:'PMU',
    label: { FR:'Sourcils PMU', EN:'Brows PMU', AR:'حواجب PMU' },
    desc: { FR:'Restructuration et définition naturelle du regard. Technique Powder Brows et Combo Brows — un résultat naturel qui dure.', EN:'Natural brow restructuring and definition. Powder Brows & Combo Brows — lasting natural results.', AR:'إعادة هيكلة وتعريف طبيعي للنظرة. باودر براوز وكومبو براوز — نتائج طبيعية دائمة.' },
    items: ['Powder Brows','Combo Brows','Retouche 1 mois','Retouche annuelle'],
    img: '/images/pmu-brows.png',
    kw: 'PRÉCISION · SAVOIR-FAIRE · RÉSULTATS NATURELS',
  },
  {
    id:'levres', cat:'PMU',
    label: { FR:'Lèvres PMU', EN:'Lips PMU', AR:'شفاه PMU' },
    desc: { FR:'Des lèvres subtilement colorées et définies, longue tenue. Candy Lips et neutralisation des lèvres foncées — l\'élégance naturelle en toutes circonstances.', EN:'Subtly colored and defined lips, long lasting. Candy Lips and dark lip neutralisation — natural elegance at all times.', AR:'شفاه ملونة ومحددة بشكل خفيف، طويلة الأمد. كاندي ليبس وتحييد الشفاه الداكنة.' },
    items: ['Candy Lips','Neutralisation lèvres foncées','Retouche annuelle'],
    img: '/images/levres.png',
    kw: 'COLORATION SUBTILE · LONGUE TENUE',
  },
  {
    id:'makeup', cat:'MAKEUP',
    label: { FR:'Makeup Pro', EN:'Pro Makeup', AR:'ميكاب احترافي' },
    desc: { FR:'Maquillage professionnel pour toutes vos occasions. Du quotidien au mariage, chaque regard est sculpté avec précision et adapté à votre carnation.', EN:'Professional makeup for all your occasions. From everyday to weddings, every look is precision-crafted for your complexion.', AR:'مكياج احترافي لجميع مناسباتك. من اليومي إلى الزفاف.' },
    items: ['Makeup Jour','Makeup Soirée','Makeup Mariée','Essai Mariée','Shooting / Event'],
    img: '/images/sourcils-regard.png',
    kw: 'DES REGARDS QUI MARQUENT · POUR TOUTES VOS OCCASIONS',
  },
  {
    id:'nails', cat:'NAILS',
    label: { FR:'Nails', EN:'Nails', AR:'أظافر' },
    desc: { FR:'Manucure classique, semi-permanent et Nail Art — élégance jusque au bout des ongles. Des teints qui vous ressemblent, une finition impeccable.', EN:'Classic manicure, semi-permanent and Nail Art — elegance to your fingertips.', AR:'مانيكير كلاسيك، شبه دائم وناي آرت — أناقة حتى أطراف أصابعك.' },
    items: ['Manucure classique','Semi-Permanent','Semi-Permanent French','Pédicure simple','Pédicure semi-permanent','Nail Art'],
    img: '/images/teints.png',
    kw: 'ÉLÉGANCE JUSQUE AU BOUT DES ONGLES',
  },
]

const BA = [
  { label:'Powder Brows', before:'/images/pmu-brows.png', after:'/images/sourcils-regard.png' },
  { label:'Candy Lips',   before:'/images/teints.png',    after:'/images/levres.png' },
]

const HEALTH_FR = ['Grossesse','Diabète','Allergies','Traitement médical en cours','Problèmes de peau','Herpès (labial ou autre)','Anticoagulants']
const HEALTH_EN = ['Pregnancy','Diabetes','Allergies','Current medical treatment','Skin conditions','Herpes','Blood thinners']
const HEALTH_AR = ['حمل','سكري','حساسية','علاج طبي حالي','مشاكل جلدية','هيرباس','مضادات التخثر']
const HEALTH = { FR: HEALTH_FR, EN: HEALTH_EN, AR: HEALTH_AR }

const CONSENT_TEXT = `Je certifie avoir pris connaissance des contre-indications et accepte la réalisation de la prestation.\n\nInstructions après la prestation — Pendant 7 jours :\n• Ne pas mouiller la zone\n• Éviter sauna, piscine, soleil\n• Ne pas gratter\n• Éviter maquillage sur la zone\nUne retouche est recommandée après cicatrisation.`

// ─── CSS ───────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Montserrat',sans-serif;background:${C.noir};color:${C.blanc};overflow-x:hidden;-webkit-font-smoothing:antialiased}

/* ── FLOATERS ── */
.floaters{position:fixed;top:20px;right:20px;z-index:400;display:flex;flex-direction:column;gap:8px}
[dir=rtl] .floaters{right:auto;left:20px}
.pill{background:rgba(13,11,9,0.88);backdrop-filter:blur(20px);border:1px solid rgba(201,169,106,0.2);border-radius:50px;display:flex;gap:2px;padding:3px}
.pill button{background:transparent;border:none;border-radius:30px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.08em;padding:6px 12px;color:rgba(251,247,242,0.35);transition:all 0.2s}
.pill button.on{background:${C.or};color:${C.noir};font-weight:600}
.pill.wa button.on{background:#25D366;color:white}

/* ── ISLAND NAV ── */
.island{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:400;background:rgba(13,11,9,0.94);backdrop-filter:blur(24px);border:1px solid rgba(201,169,106,0.12);border-radius:100px;padding:9px 20px;display:flex;gap:2px;max-width:calc(100vw - 32px);overflow-x:auto;scrollbar-width:none}
.island::-webkit-scrollbar{display:none}
.island a{color:rgba(251,247,242,0.35);text-decoration:none;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;letter-spacing:0.1em;padding:7px 14px;border-radius:50px;white-space:nowrap;transition:all 0.25s}
.island a:hover,.island a.on{background:rgba(201,169,106,0.12);color:${C.or}}

/* ── WA FAB ── */
.wa-fab{position:fixed;bottom:88px;right:22px;z-index:390;width:52px;height:52px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 4px 24px rgba(37,211,102,0.4);transition:transform 0.2s,box-shadow 0.2s}
.wa-fab:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(37,211,102,0.55)}
[dir=rtl] .wa-fab{right:auto;left:22px}

/* ── SCROLL REVEAL ── */
.rv{opacity:0;transform:translateY(40px);transition:opacity 0.85s cubic-bezier(0.16,1,0.3,1),transform 0.85s cubic-bezier(0.16,1,0.3,1)}
.rv.go{opacity:1;transform:none}
.rv-l{opacity:0;transform:translateX(-40px);transition:opacity 0.85s cubic-bezier(0.16,1,0.3,1),transform 0.85s cubic-bezier(0.16,1,0.3,1)}
.rv-l.go{opacity:1;transform:none}
.rv-r{opacity:0;transform:translateX(40px);transition:opacity 0.85s cubic-bezier(0.16,1,0.3,1),transform 0.85s cubic-bezier(0.16,1,0.3,1)}
.rv-r.go{opacity:1;transform:none}

/* ── HERO ── */
.hero{position:relative;height:100svh;min-height:700px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.hero-bg{position:absolute;inset:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;object-position:center top;animation:hZoom 12s ease forwards}
@keyframes hZoom{from{transform:scale(1.1)}to{transform:scale(1)}}
.hero-grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,11,9,0.25) 0%,rgba(13,11,9,0.0) 30%,rgba(13,11,9,0.65) 70%,rgba(13,11,9,0.95) 100%)}
.hero-content{position:relative;z-index:2;padding:0 52px 108px}
@media(max-width:640px){.hero-content{padding:0 28px 120px}}
.hero-logo{display:flex;align-items:center;gap:18px;margin-bottom:40px;opacity:0;animation:fUp 1s 0.2s cubic-bezier(0.16,1,0.3,1) forwards}
.hero-tag{font-size:10px;font-weight:300;letter-spacing:0.4em;color:${C.or};text-transform:uppercase;margin-bottom:18px;opacity:0;animation:fUp 1s 0.5s cubic-bezier(0.16,1,0.3,1) forwards}
.hero-h1{font-family:'Cormorant Garamond',serif;font-weight:300;color:${C.blanc};margin-bottom:36px;opacity:0;animation:fUp 1s 0.7s cubic-bezier(0.16,1,0.3,1) forwards}
.hero-h1 em{display:block;font-size:clamp(42px,7vw,86px);font-style:italic;line-height:1;color:rgba(251,247,242,0.6)}
.hero-h1 strong{display:block;font-size:clamp(42px,7vw,86px);font-weight:300;line-height:1}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap;opacity:0;animation:fUp 1s 0.9s cubic-bezier(0.16,1,0.3,1) forwards}
@keyframes fUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}

/* ── TAG ── */
.tag{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:${C.or};display:flex;align-items:center;gap:14px}
.tag::before,.tag::after{content:'';display:block;height:1px;background:currentColor;width:28px}
.tag.no-after::after{display:none}

/* ── BTNS ── */
.btn-or{background:${C.or};color:${C.noir};border:none;border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;padding:15px 36px;text-decoration:none;display:inline-flex;align-items:center;text-transform:uppercase;transition:all 0.25s}
.btn-or:hover{background:${C.orClair};transform:translateY(-2px);box-shadow:0 8px 28px rgba(201,169,106,0.35)}
.btn-or:disabled{opacity:0.35;cursor:not-allowed;transform:none}
.btn-outline{background:transparent;color:${C.blanc};border:1px solid rgba(251,247,242,0.25);border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.2em;padding:14px 32px;text-decoration:none;display:inline-flex;align-items:center;text-transform:uppercase;transition:all 0.25s}
.btn-outline:hover{border-color:rgba(251,247,242,0.6)}
.btn-ghost-dark{background:transparent;color:${C.taupe};border:1px solid ${C.beige};border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:400;letter-spacing:0.15em;padding:12px 22px;text-transform:uppercase;transition:all 0.2s}

/* ── BRAND ── */
.brand-sec{background:${C.creme}}
.brand-inner{display:grid;grid-template-columns:1fr 1fr;min-height:100vh;align-items:stretch}
@media(max-width:800px){.brand-inner{grid-template-columns:1fr}}
.brand-img-col{position:relative;overflow:hidden;min-height:60vw}
.brand-img-col img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transition:transform 1s cubic-bezier(0.16,1,0.3,1)}
.brand-img-col:hover img{transform:scale(1.03)}
.brand-txt-col{padding:80px 64px;display:flex;flex-direction:column;justify-content:center;background:${C.creme}}
@media(max-width:800px){.brand-txt-col{padding:56px 32px}}
.brand-h{font-family:'Cormorant Garamond',serif;font-size:clamp(52px,7vw,88px);font-weight:300;line-height:1;color:${C.noir};white-space:pre-line;margin:20px 0 28px}
.brand-p{font-size:13px;font-weight:300;line-height:1.9;color:${C.taupe};max-width:42ch;margin-bottom:36px}
.brand-kws{display:flex;flex-direction:column;gap:8px}
.brand-kw{font-size:9px;font-weight:500;letter-spacing:0.3em;color:${C.orFonce};text-transform:uppercase}

/* ── SERVICES ── */
.svc-sec{background:${C.noir};padding:100px 0}
.svc-header{text-align:center;padding:0 48px 72px}
.svc-header-h{font-family:'Cormorant Garamond',serif;font-size:clamp(40px,5vw,64px);font-weight:300;color:${C.blanc};margin-top:20px}

/* Alternance image/texte */
.svc-row{display:grid;grid-template-columns:1fr 1fr;min-height:600px}
@media(max-width:768px){.svc-row{grid-template-columns:1fr}}
.svc-row.rev .svc-img{order:2}
.svc-row.rev .svc-txt{order:1}
@media(max-width:768px){.svc-row.rev .svc-img,.svc-row.rev .svc-txt{order:unset}}
.svc-img{position:relative;overflow:hidden}
.svc-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.9s cubic-bezier(0.16,1,0.3,1);min-height:400px}
.svc-img:hover img{transform:scale(1.05)}
.svc-txt{background:${C.brun};padding:72px 60px;display:flex;flex-direction:column;justify-content:center}
@media(max-width:768px){.svc-txt{padding:48px 32px}}
.svc-num{font-family:'Cormorant Garamond',serif;font-size:80px;font-weight:300;color:rgba(201,169,106,0.1);line-height:1;margin-bottom:-12px}
.svc-cat{font-size:9px;font-weight:600;letter-spacing:0.35em;color:${C.or};margin-bottom:12px;text-transform:uppercase}
.svc-title{font-family:'Cormorant Garamond',serif;font-size:clamp(32px,4vw,48px);font-weight:300;color:${C.blanc};margin-bottom:10px}
.svc-kwtxt{font-size:8px;font-weight:400;letter-spacing:0.28em;color:rgba(201,169,106,0.6);text-transform:uppercase;margin-bottom:24px}
.svc-desc{font-size:13px;font-weight:300;line-height:1.85;color:rgba(251,247,242,0.55);margin-bottom:32px;max-width:38ch}
.svc-list{display:flex;flex-direction:column;gap:10px;margin-bottom:40px}
.svc-list-item{display:flex;align-items:center;gap:12px;font-size:12px;font-weight:300;color:rgba(251,247,242,0.65);letter-spacing:0.04em}
.svc-list-item::before{content:'';width:16px;height:1px;background:${C.or};flex-shrink:0}
.divider-or{width:100%;height:1px;background:linear-gradient(90deg,transparent,${C.or},transparent);opacity:0.15}

/* ── MOODBOARD STRIP ── */
.mood-sec{background:${C.noir};display:flex;gap:3px;overflow:hidden}
.mood-item{flex:1;min-width:160px;position:relative;overflow:hidden;cursor:pointer}
.mood-item img{width:100%;aspect-ratio:3/5;object-fit:cover;object-position:top;display:block;transition:transform 0.7s cubic-bezier(0.16,1,0.3,1),filter 0.4s;filter:brightness(0.7) saturate(0.85)}
.mood-item:hover img{transform:scale(1.06);filter:brightness(0.9) saturate(1)}
.mood-over{position:absolute;bottom:0;left:0;right:0;padding:20px 16px;background:linear-gradient(to top,rgba(13,11,9,0.88) 0%,transparent 100%)}
.mood-label{font-size:8px;font-weight:500;letter-spacing:0.3em;color:${C.or};text-transform:uppercase;margin-bottom:4px}
.mood-name{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:300;color:${C.blanc};letter-spacing:0.1em}

/* ── BEFORE/AFTER ── */
.ba-sec{background:${C.creme};padding:110px 52px}
@media(max-width:640px){.ba-sec{padding:72px 28px}}
.ba-h{font-family:'Cormorant Garamond',serif;font-size:clamp(44px,6vw,72px);font-weight:300;color:${C.noir};white-space:pre-line;margin:20px 0 64px;line-height:0.95}
.ba-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:640px){.ba-grid{grid-template-columns:1fr}}
.ba-lbl{font-size:9px;font-weight:600;letter-spacing:0.3em;color:${C.orFonce};text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:10px}
.ba-lbl::before{content:'';width:20px;height:1px;background:currentColor}
.ba-slider{position:relative;border-radius:20px;overflow:hidden;cursor:col-resize;user-select:none;touch-action:none;box-shadow:0 20px 60px rgba(13,11,9,0.15)}
.ba-img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
.ba-after{position:absolute;inset:0;overflow:hidden}
.ba-after img{width:100%;height:100%;object-fit:cover}
.ba-line{position:absolute;top:0;bottom:0;width:2px;background:${C.blanc}}
.ba-handle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;background:${C.blanc};display:flex;align-items:center;justify-content:center;color:${C.noir};font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,0.2)}
.ba-ends{display:flex;justify-content:space-between;margin-top:10px}
.ba-end{font-size:9px;letter-spacing:0.25em;color:${C.taupe};text-transform:uppercase}

/* ── BOOK CTA ── */
.book-sec{background:${C.noir};padding:130px 52px;text-align:center;position:relative;overflow:hidden}
.book-sec::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 100%,rgba(201,169,106,0.06) 0%,transparent 70%);pointer-events:none}
.book-h{font-family:'Cormorant Garamond',serif;font-size:clamp(52px,8vw,96px);font-weight:300;color:${C.blanc};white-space:pre-line;line-height:0.95;margin:20px 0 24px}
.book-sub{font-size:13px;font-weight:300;color:rgba(251,247,242,0.45);line-height:1.8;max-width:42ch;margin:0 auto 48px}

/* ── CONTACT ── */
.contact-sec{background:${C.brun};padding:110px 52px}
@media(max-width:640px){.contact-sec{padding:72px 28px}}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:96px;max-width:1000px;margin:0 auto}
@media(max-width:768px){.contact-grid{grid-template-columns:1fr;gap:56px}}
.contact-h{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:300;color:${C.blanc};margin:20px 0 8px}
.contact-sub{font-size:9px;letter-spacing:0.22em;color:rgba(251,247,242,0.28);text-transform:uppercase;margin-bottom:48px}
.ci{margin-bottom:28px}
.ci-l{font-size:8px;font-weight:600;letter-spacing:0.28em;color:${C.or};text-transform:uppercase;margin-bottom:6px}
.ci-v{font-size:13px;font-weight:300;color:rgba(251,247,242,0.7);line-height:1.6}
.contact-btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:40px}
.map-box{border-radius:20px;overflow:hidden;position:relative}
.map-box img{width:100%;aspect-ratio:1;object-fit:cover;display:block;filter:brightness(0.6) saturate(0.8);transition:filter 0.4s}
.map-box:hover img{filter:brightness(0.75) saturate(1)}
.map-pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);font-size:36px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4))}

/* ── FOOTER ── */
.footer{background:${C.noir};border-top:1px solid rgba(201,169,106,0.1);padding:64px 52px 120px}
@media(max-width:640px){.footer{padding:48px 28px 110px}}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:40px;margin-bottom:52px}
.footer-links{display:flex;gap:28px;flex-wrap:wrap}
.footer-links a{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;letter-spacing:0.08em;color:rgba(251,247,242,0.25);text-decoration:none;transition:color 0.2s}
.footer-links a:hover{color:${C.or}}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(251,247,242,0.06);padding-top:28px;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:10px;font-weight:300;color:rgba(251,247,242,0.18)}

/* ── MODAL BOOKING ── */
.modal-back{position:fixed;inset:0;background:rgba(5,4,3,0.85);backdrop-filter:blur(12px);z-index:700;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:640px){.modal-back{align-items:center}}
.modal{background:${C.blanc};border-radius:28px 28px 0 0;width:100%;max-width:520px;max-height:93svh;overflow-y:auto;padding:36px 32px 52px;animation:mUp 0.4s cubic-bezier(0.16,1,0.3,1)}
@media(min-width:640px){.modal{border-radius:28px}}
@keyframes mUp{from{opacity:0;transform:translateY(32px) scale(0.98)}to{opacity:1;transform:none}}
.steps-bar{display:flex;gap:4px;margin-bottom:28px}
.step-seg{flex:1;height:2px;border-radius:2px;background:#E5DDD4;transition:background 0.35s}
.step-seg.done{background:${C.or}}
.modal-h{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:${C.noir};margin-bottom:4px}
.modal-sub{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.22em;color:${C.taupe};text-transform:uppercase;margin-bottom:28px}

/* Inputs */
.f-lbl{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${C.taupe};margin-bottom:7px;display:block}
.f-in{width:100%;padding:13px 16px;border:1.5px solid #E0D5C8;border-radius:14px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;background:white;color:${C.noir};outline:none;transition:border-color 0.2s;margin-bottom:16px}
.f-in:focus{border-color:${C.nude}}
.f-textarea{width:100%;padding:13px 16px;border:1.5px solid #E0D5C8;border-radius:14px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;background:white;color:${C.noir};outline:none;resize:vertical;min-height:80px;margin-bottom:16px}

/* Catégories */
.cat-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.cat-tab{padding:8px 16px;border-radius:100px;border:1.5px solid #E0D5C8;background:white;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.1em;color:${C.taupe};transition:all 0.2s}
.cat-tab.on{background:${C.noir};border-color:${C.noir};color:${C.blanc}}

/* Prestations */
.svc-items-list{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.svc-pick-item{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1.5px solid #E0D5C8;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;text-align:left}
.svc-pick-item:hover,.svc-pick-item.on{border-color:${C.nude};background:#FBF5EE}
.svc-pick-item .radio{width:18px;height:18px;border-radius:50%;border:2px solid #D0C5B8;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.svc-pick-item.on .radio{background:${C.or};border-color:${C.or}}
.svc-pick-item.on .radio::after{content:'';width:6px;height:6px;border-radius:50%;background:white}
.svc-pick-name{font-size:13px;font-weight:400;color:${C.noir}}

/* Calendrier */
.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.cal-nav{background:transparent;border:1.5px solid #E0D5C8;border-radius:10px;width:32px;height:32px;cursor:pointer;font-size:14px;color:${C.taupe};display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.cal-nav:hover{border-color:${C.nude};color:${C.noir}}
.cal-month{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;color:${C.noir};text-transform:capitalize}
.cal-days-header{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px}
.cal-day-lbl{text-align:center;font-size:9px;font-weight:600;letter-spacing:0.1em;color:${C.taupe};padding:4px 0;text-transform:uppercase}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:20px}
.cal-day{width:100%;aspect-ratio:1;border-radius:12px;border:none;background:transparent;cursor:default;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:300;color:#C5B9AD;display:flex;align-items:center;justify-content:center}
.cal-day.avail{background:#FBF5EE;color:${C.noir};cursor:pointer;transition:all 0.15s;border:1.5px solid transparent}
.cal-day.avail:hover{border-color:${C.nude}}
.cal-day.sel{background:${C.noir};color:${C.blanc};border-color:${C.noir}}
.slots-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.slot-btn{padding:9px 16px;border-radius:100px;border:1.5px solid #E0D5C8;background:white;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:400;color:${C.noir};transition:all 0.15s}
.slot-btn:hover{border-color:${C.nude}}
.slot-btn.on{background:${C.noir};border-color:${C.noir};color:${C.blanc}}

/* Santé */
.health-list{display:flex;flex-direction:column;gap:11px;margin-bottom:16px}
.h-item{display:flex;align-items:center;gap:12px;cursor:pointer;padding:10px 12px;border-radius:12px;transition:background 0.15s}
.h-item:hover{background:#FBF5EE}
.h-check{width:18px;height:18px;accent-color:${C.nude};cursor:pointer;flex-shrink:0}
.h-label{font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;color:${C.noir}}

/* Alerte CI */
.ci-alert{background:#FFFBF0;border:1.5px solid ${C.orFonce};border-radius:16px;padding:18px;margin-bottom:16px}
.ci-alert-title{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;color:${C.orFonce};margin-bottom:8px}
.ci-alert-text{font-family:'Montserrat',sans-serif;font-size:12px;font-weight:300;color:#7A5C2A;line-height:1.65}

/* Paiement */
.pay-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.pay-opt{display:flex;align-items:flex-start;gap:14px;padding:16px;border:1.5px solid #E0D5C8;border-radius:16px;background:white;cursor:pointer;transition:all 0.2s;text-align:left}
.pay-opt:hover,.pay-opt.on{border-color:${C.nude};background:#FBF5EE}
.pay-opt .radio{width:18px;height:18px;border-radius:50%;border:2px solid #D0C5B8;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.pay-opt.on .radio{background:${C.or};border-color:${C.or}}
.pay-opt.on .radio::after{content:'';width:6px;height:6px;border-radius:50%;background:white}
.pay-name{font-size:13px;font-weight:500;color:${C.noir};margin-bottom:4px}
.pay-desc{font-size:11px;font-weight:300;color:${C.taupe};line-height:1.5}

/* Modal footer */
.modal-foot{display:flex;gap:10px;margin-top:24px}
.btn-prev{background:transparent;border:1.5px solid #E0D5C8;border-radius:100px;padding:12px 20px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:400;cursor:pointer;color:${C.taupe};transition:border-color 0.2s;letter-spacing:0.1em}
.btn-prev:hover{border-color:${C.nude}}

/* Toast */
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:900;background:${C.noir};color:${C.blanc};padding:14px 24px;border-radius:100px;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;letter-spacing:0.05em;box-shadow:0 8px 32px rgba(0,0,0,0.3);border:1px solid rgba(201,169,106,0.2);animation:toastIn 0.3s ease;max-width:90vw;text-align:center}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`

// ─── LOGO SVG ──────────────────────────────────────────────────
function LogoMark({ size = 80, light = false }: { size?: number; light?: boolean }) {
  const g = light ? '#F5EDE0' : 'url(#g1)'
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <defs>
        <linearGradient id="g1" x1="50" y1="10" x2="150" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8C97A"/>
          <stop offset="50%" stopColor="#C9A96A"/>
          <stop offset="100%" stopColor="#A07840"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="93" stroke={light ? 'rgba(245,237,224,0.6)' : 'url(#g1)'} strokeWidth="1.2" fill="none"/>
      <circle cx="100" cy="100" r="87" stroke={light ? 'rgba(245,237,224,0.3)' : 'url(#g1)'} strokeWidth="0.6" fill="none" opacity="0.5"/>
      {/* Jambe gauche A */}
      <path d="M63 158 L96 35" stroke={g} strokeWidth="3" strokeLinecap="round"/>
      {/* Jambe droite A (large - corps) */}
      <path d="M137 158 L96 35" stroke={g} strokeWidth="13" strokeLinecap="round" opacity="0.9"/>
      {/* Profil visage dans jambe droite */}
      <path d="M115 55 C119 60,123 68,121 78 C119 87,114 91,117 100 C119 107,121 110,119 117"
        stroke={light ? 'rgba(245,237,224,0.9)' : 'url(#g1)'} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M117 100 C115 104,113 107,115 110" stroke={light ? 'rgba(245,237,224,0.9)' : 'url(#g1)'} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Traverse */}
      <path d="M73 120 L127 120" stroke={g} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Boucle calligraphique */}
      <path d="M63 158 C56 162,44 158,47 150 C50 142,62 145,68 140 C74 135,72 127,62 129"
        stroke={g} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function LogoWordmark({ color = C.blanc, scale = 1 }: { color?: string; scale?: number }) {
  return (
    <div style={{ lineHeight: 1 }}>
      <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize: 24 * scale, fontWeight: 300, color, letterSpacing: '0.22em', textTransform:'uppercase' }}>ADORÉA</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontSize: 8 * scale, fontWeight: 300, color, letterSpacing: '0.22em', textTransform:'uppercase', marginTop: 4 * scale, opacity: 0.6 }}>PMU & MAKEUP PRO</div>
    </div>
  )
}

// ─── BEFORE/AFTER ──────────────────────────────────────────────
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
      <div className="ba-after" style={{ clipPath:`inset(0 ${100 - pos}% 0 0)` }}>
        <img src={after} alt="après" />
      </div>
      <div className="ba-line" style={{ left:`${pos}%` }}><div className="ba-handle">⟺</div></div>
    </div>
  )
}

// ─── SCROLL REVEAL ─────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('go'); obs.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.rv,.rv-l,.rv-r').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── BOOKING MODAL ─────────────────────────────────────────────
function BookingModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = T[lang]
  const [step, setStep]         = useState(0)
  const [selectedCat, setCat]   = useState<string | null>(null)
  const [selectedSvc, setSvc]   = useState<string | null>(null)
  const [selDate, setDate]       = useState<string | null>(null)
  const [selSlot, setSlot]       = useState<string | null>(null)
  const [health, setHealth]      = useState<boolean[]>(new Array(HEALTH_FR.length).fill(false))
  const [comment, setComment]    = useState('')
  const [form, setForm]          = useState({ nom:'', prenom:'', tel:'', dob:'' })
  const [payMethod, setPay]      = useState<string | null>(null)
  const [showToast, setToast]    = useState(false)

  const hasCI = health.some(Boolean)

  // Calendrier
  const now = new Date()
  const [calYear, setCalYear]   = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const DAYS = ['L','M','M','J','V','S','D']
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

  const cats = [...new Set(SERVICES.map(s => s.cat))]
  const filteredSvcs = selectedCat ? SERVICES.filter(s => s.cat === selectedCat) : SERVICES

  // Messages WA
  const waBaseMsg = () => {
    const svc = selectedSvc || '—'
    const date = selDate ? `${selDate} à ${selSlot}` : '—'
    return `Bonjour ADORÉA,\n\nJe souhaite réserver une prestation.\n\nPrestation : ${svc}\nDate souhaitée : ${date}\n\nMes coordonnées :\nPrénom : ${form.prenom}\nNom : ${form.nom}\nTéléphone : ${form.tel}`
  }

  const waSanteMsg = () => waBaseMsg() + `\n\nInformations santé : j'ai coché des contre-indications qui nécessitent votre validation avant confirmation définitive.\n\nMerci de me confirmer la prise en charge de mon rendez-vous.`

  const waPayMsg = (methode: string) => waBaseMsg() + `\n\nMode de paiement : ${methode}\nJe vous envoie la capture de paiement en pièce jointe.\n\nMerci de confirmer ma réservation.`

  const waNumber = '25377596159'

  function nextStep() {
    // Vérifications par étape
    if (step === 0 && !selectedSvc) return
    if (step === 1 && (!selDate || !selSlot)) return
    if (step === 2 && (!form.prenom || !form.nom || !form.tel)) return
    setStep(s => s + 1)
  }

  function handlePay(m: string) {
    setPay(m)
    // Ouvrir WA avec le message approprié
    const msg = hasCI ? waSanteMsg() : waPayMsg(m)
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const canNext = [
    !!selectedSvc,
    !!(selDate && selSlot),
    !!(form.prenom && form.nom && form.tel),
    true, // santé toujours OK pour continuer
    false, // étape paiement = pas de "suivant"
  ][step]

  const PAY_OPTIONS = [
    {
      key:'cac_pay', name:'CAC PAY',
      desc: lang==='FR' ? 'Envoyez votre capture de paiement par WhatsApp pour confirmer votre réservation.' : 'Send payment screenshot via WhatsApp.',
    },
    {
      key:'waafi', name:'WAAFI',
      desc: lang==='FR' ? 'Effectuez le paiement sur WAAFI puis envoyez la capture par WhatsApp.' : 'Pay via WAAFI and send the screenshot.',
    },
    {
      key:'d_money', name:'D-MONEY',
      desc: lang==='FR' ? 'Payez via D-Money et envoyez la preuve de paiement par WhatsApp.' : 'Pay via D-Money and share the receipt.',
    },
    {
      key:'cash', name:'CASH',
      desc: lang==='FR' ? 'Le paiement en espèces est réservé aux clientes ayant déjà effectué au moins une prestation chez ADORÉA.' : 'Cash payment is only available for returning clients.',
    },
  ]

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Progress */}
        <div className="steps-bar">
          {t.book_step.map((_, i) => <div key={i} className={`step-seg${i <= step ? ' done' : ''}`}/>)}
        </div>
        <h2 className="modal-h">{t.book_step[step]}</h2>
        <p className="modal-sub">ADORÉA · {t.cert}</p>

        {/* ── STEP 0 : Prestation ── */}
        {step === 0 && (
          <>
            {/* Filtres par catégorie */}
            <div className="cat-tabs">
              {cats.map(c => (
                <button key={c} className={`cat-tab${selectedCat === c ? ' on' : ''}`}
                  onClick={() => { setCat(selectedCat === c ? null : c); setSvc(null) }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="svc-items-list">
              {filteredSvcs.flatMap(s =>
                s.items.map(item => (
                  <button key={item} className={`svc-pick-item${selectedSvc === item ? ' on' : ''}`}
                    onClick={() => setSvc(item)}>
                    <div className="radio"/>
                    <div>
                      <div className="svc-pick-name">{item}</div>
                      <div style={{ fontSize:10, color:C.taupe, marginTop:2, letterSpacing:'0.05em' }}>{s.label[lang]}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* ── STEP 1 : Date & Heure ── */}
        {step === 1 && (
          <>
            <div className="cal-header">
              <button className="cal-nav" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }}>‹</button>
              <span className="cal-month">
                {new Date(calYear, calMonth, 1).toLocaleDateString(lang === 'AR' ? 'ar' : lang === 'EN' ? 'en-US' : 'fr-FR', { month:'long', year:'numeric' })}
              </span>
              <button className="cal-nav" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }}>›</button>
            </div>
            <div className="cal-days-header">
              {DAYS.map((d, i) => <div key={i} className="cal-day-lbl">{d}</div>)}
            </div>
            <div className="cal-grid">
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`}/>)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const str = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const isPast = str < todayStr
                const isToday = str === todayStr
                const isSel = selDate === str
                return (
                  <button key={day}
                    className={`cal-day${!isPast ? ' avail' : ''}${isSel ? ' sel' : ''}`}
                    onClick={() => !isPast && setDate(str)}
                    disabled={isPast}
                    style={{ fontWeight: isToday ? 600 : 300 }}>
                    {day}
                  </button>
                )
              })}
            </div>
            {selDate && (
              <div>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.18em', color:C.taupe, textTransform:'uppercase', marginBottom:12 }}>
                  {lang === 'AR' ? 'الأوقات المتاحة' : lang === 'EN' ? 'Available slots' : 'Créneaux disponibles'}
                </div>
                <div className="slots-grid">
                  {SLOTS.map(s => (
                    <button key={s} className={`slot-btn${selSlot === s ? ' on' : ''}`} onClick={() => setSlot(s)}>{s}</button>
                  ))}
                </div>
                <div style={{ fontSize:10, color:C.taupe, letterSpacing:'0.05em', marginTop:8, lineHeight:1.6 }}>
                  {lang === 'FR' ? '* Les créneaux affichés sont indicatifs. Votre rendez-vous sera confirmé par votre experte.' : '* Displayed slots are indicative. Your expert will confirm the appointment.'}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2 : Identité ── */}
        {step === 2 && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label className="f-lbl">{lang==='AR'?'الاسم الأول':lang==='EN'?'First name':'Prénom *'}</label>
                <input className="f-in" value={form.prenom} onChange={e => setForm(f => ({...f,prenom:e.target.value}))} />
              </div>
              <div><label className="f-lbl">{lang==='AR'?'اللقب':lang==='EN'?'Last name':'Nom *'}</label>
                <input className="f-in" value={form.nom} onChange={e => setForm(f => ({...f,nom:e.target.value}))} />
              </div>
            </div>
            <label className="f-lbl">{lang==='AR'?'الهاتف':lang==='EN'?'Phone *':'Téléphone *'}</label>
            <input className="f-in" type="tel" placeholder="+253..." value={form.tel} onChange={e => setForm(f => ({...f,tel:e.target.value}))} />
            <label className="f-lbl">{lang==='AR'?'تاريخ الميلاد':lang==='EN'?'Date of birth':'Date de naissance'}</label>
            <input className="f-in" type="date" value={form.dob} onChange={e => setForm(f => ({...f,dob:e.target.value}))} />
            <label className="f-lbl">{lang==='AR'?'ملاحظات':lang==='EN'?'Notes / Comments':'Notes / Commentaires'}</label>
            <textarea className="f-textarea" placeholder={lang==='FR'?'Informations complémentaires...':lang==='EN'?'Additional information...':'معلومات إضافية...'} value={comment} onChange={e => setComment(e.target.value)} />
          </>
        )}

        {/* ── STEP 3 : Santé ── */}
        {step === 3 && (
          <>
            <p style={{ fontSize:12, fontWeight:300, color:C.taupe, lineHeight:1.7, marginBottom:20 }}>
              {lang==='FR' ? 'Veuillez indiquer si vous êtes concernée par l\'une des situations suivantes :' : lang==='EN' ? 'Please indicate if any of the following apply to you :' : 'يرجى الإشارة إلى ما ينطبق عليكِ :'}
            </p>
            <div className="health-list">
              {HEALTH[lang].map((item, i) => (
                <label key={i} className="h-item">
                  <input type="checkbox" className="h-check" checked={health[i]}
                    onChange={e => setHealth(h => h.map((v, j) => j === i ? e.target.checked : v))} />
                  <span className="h-label">{item}</span>
                </label>
              ))}
            </div>

            {/* Message CI — pas de popup, message inline */}
            {hasCI && (
              <div className="ci-alert">
                <div className="ci-alert-title">ℹ️ {lang==='FR' ? 'Information importante' : lang==='EN' ? 'Important information' : 'معلومة مهمة'}</div>
                <div className="ci-alert-text">
                  {lang==='FR'
                    ? 'Votre rendez-vous ne sera pas automatiquement confirmé. Votre experte prendra contact avec vous pour valider votre réservation avant confirmation définitive.'
                    : lang==='EN'
                    ? 'Your appointment will not be automatically confirmed. Your expert will contact you to validate your booking.'
                    : 'لن يتم تأكيد موعدك تلقائيًا. ستتواصل معكِ خبيرتك للتحقق من حجزكِ.'}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP 4 : Paiement ── */}
        {step === 4 && (
          <>
            {/* Récap */}
            <div style={{ background:'#FBF5EE', borderRadius:16, padding:'14px 18px', marginBottom:20 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.18em', color:C.taupe, textTransform:'uppercase', marginBottom:10 }}>
                {lang==='FR'?'Récapitulatif':lang==='EN'?'Summary':'ملخص'}
              </div>
              {[
                { l: lang==='FR'?'Soin':lang==='EN'?'Service':'الخدمة', v: selectedSvc },
                { l: lang==='FR'?'Date':lang==='EN'?'Date':'التاريخ', v: selDate ? `${selDate} · ${selSlot}` : '—' },
                { l: lang==='FR'?'Cliente':lang==='EN'?'Client':'العميلة', v: `${form.prenom} ${form.nom}` },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #EAE0D5', fontSize:12 }}>
                  <span style={{ color:C.taupe }}>{r.l}</span>
                  <span style={{ color:C.noir, fontWeight:400 }}>{r.v}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize:11, fontWeight:300, color:C.taupe, lineHeight:1.7, marginBottom:20 }}>
              {lang==='FR' ? 'Choisissez votre mode de paiement. En cliquant, vous serez redirigée vers WhatsApp pour envoyer votre confirmation de paiement.' : 'Choose your payment method. Clicking will redirect you to WhatsApp to send your payment confirmation.'}
            </p>

            <div className="pay-list">
              {PAY_OPTIONS.map(opt => (
                <button key={opt.key} className={`pay-opt${payMethod === opt.key ? ' on' : ''}`}
                  onClick={() => handlePay(opt.name)}>
                  <div className="radio"/>
                  <div>
                    <div className="pay-name">{opt.name}</div>
                    <div className="pay-desc">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="modal-foot">
          {step > 0 && (
            <button className="btn-prev" onClick={() => setStep(s => s - 1)}>{t.prev}</button>
          )}
          {step < 4 && (
            <button className="btn-or"
              style={{ flex:1, justifyContent:'center', opacity: canNext ? 1 : 0.35, cursor: canNext ? 'pointer' : 'not-allowed' }}
              onClick={nextStep}
              disabled={!canNext}>
              {t.next}
            </button>
          )}
          {step === 4 && (
            <button className="btn-or" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>
              {lang==='FR'?'Fermer':lang==='EN'?'Close':'إغلاق'}
            </button>
          )}
        </div>
      </div>
      {showToast && (
        <div className="toast">
          {lang==='FR'?'Votre demande a été envoyée par WhatsApp':lang==='EN'?'Your request was sent via WhatsApp':'تم إرسال طلبك عبر واتساب'}
        </div>
      )}
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>('FR')
  const [waOn, setWaOn] = useState(true)
  const [booking, setBooking] = useState(false)
  const t = T[lang]
  const dir = lang === 'AR' ? 'rtl' : 'ltr'

  useReveal()

  const moodItems = [
    { img:'/images/hero-woman.png',    label:'MAKEUP', name:'Makeup Pro' },
    { img:'/images/pmu-brows.png',     label:'PMU',    name:'Sourcils' },
    { img:'/images/levres.png',        label:'PMU',    name:'Lèvres' },
    { img:'/images/djibouti-woman.png',label:'DJIBOUTI',name:'ADORÉA' },
    { img:'/images/flowers.png',       label:'ART',    name:'Beauté' },
  ]

  return (
    <div dir={dir}>
      <style>{CSS}</style>

      {/* ── FLOATERS ── */}
      <div className="floaters">
        <div className="pill">
          {(['FR','EN','AR'] as Lang[]).map(l => (
            <button key={l} className={lang===l?'on':''} onClick={() => setLang(l)}>{l}</button>
          ))}
        </div>
        <div className="pill wa">
          <button className={waOn?'on':''} onClick={() => setWaOn(true)}>WA</button>
          <button className={!waOn?'on':''} onClick={() => setWaOn(false)}>OFF</button>
        </div>
      </div>

      {waOn && (
        <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="wa-fab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}

      {/* ── ISLAND NAV ── */}
      <nav className="island">
        {t.nav.map((item, i) => (
          <a key={i} href={['#hero','#rdv','#sourcils','#levres','#makeup','#nails','#contact'][i]}>{item}</a>
        ))}
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <img src="/images/djibouti-woman.png" alt="ADORÉA" />
        </div>
        <div className="hero-grad"/>
        <div className="hero-content">
          <div className="hero-logo">
            <LogoMark size={72} light />
            <LogoWordmark color={C.blanc} scale={0.9} />
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

      {/* ══ BRAND ══ */}
      <section className="brand-sec">
        <div className="brand-inner">
          <div className="brand-img-col rv-l">
            <img src="/images/brand-beige.png" alt="ADORÉA Brand" />
          </div>
          <div className="brand-txt-col">
            <div className="tag rv">{t.brand_tag}</div>
            <h2 className="brand-h rv" style={{ transitionDelay:'0.1s' }}>{t.brand_h}</h2>
            <p className="brand-p rv" style={{ transitionDelay:'0.2s' }}>
              {lang==='FR'
                ? 'ADORÉA est un studio beauté premium à Djibouti. Spécialisé dans le maquillage permanent, le makeup professionnel et l\'art des ongles, chaque prestation est réalisée avec des pigments certifiés et des techniques maîtrisées en Belgique.'
                : lang==='EN'
                ? 'ADORÉA is a premium beauty studio in Djibouti. Specialising in permanent makeup, professional beauty and nail artistry, every treatment uses certified pigments and Belgian-certified techniques.'
                : 'أدوريا استوديو تجميل فاخر في جيبوتي. متخصص في الوشم التجميلي والمكياج الاحترافي وفن الأظافر، كل خدمة تُنفَّذ بأصباغ معتمدة وتقنيات بلجيكية.'}
            </p>
            <div className="brand-kws rv" style={{ transitionDelay:'0.3s' }}>
              {t.brand_kw.map((k, i) => <div key={i} className="brand-kw" style={{ transitionDelay:`${0.35 + i * 0.05}s` }}>{k}</div>)}
            </div>
            <div className="rv" style={{ marginTop:36, transitionDelay:'0.45s' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'14px 20px', border:`1px solid ${C.orFonce}`, borderRadius:100 }}>
                <LogoMark size={28} />
                <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:500, letterSpacing:'0.2em', color:C.taupe, textTransform:'uppercase' }}>{t.cert}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section className="svc-sec" id="services">
        <div className="svc-header">
          <div className="tag rv" style={{ justifyContent:'center' }}>{t.svc_tag}</div>
          <h2 className="svc-header-h rv" style={{ transitionDelay:'0.1s' }}>{t.svc_sub}</h2>
        </div>

        {SERVICES.map((s, idx) => (
          <div key={s.id} id={s.id}>
            <div className={`svc-row${idx % 2 === 1 ? ' rev' : ''}`}>
              <div className="svc-img rv">
                <img src={s.img} alt={s.label[lang]} />
              </div>
              <div className="svc-txt">
                <div className="svc-num rv">{String(idx + 1).padStart(2,'0')}</div>
                <div className="svc-cat rv" style={{ transitionDelay:'0.05s' }}>{s.cat}</div>
                <h3 className="svc-title rv" style={{ transitionDelay:'0.1s' }}>{s.label[lang]}</h3>
                <div className="svc-kwtxt rv" style={{ transitionDelay:'0.15s' }}>{s.kw}</div>
                <p className="svc-desc rv" style={{ transitionDelay:'0.2s' }}>{s.desc[lang]}</p>
                <div className="svc-list rv" style={{ transitionDelay:'0.25s' }}>
                  {s.items.map((item, j) => <div key={j} className="svc-list-item">{item}</div>)}
                </div>
                <div className="rv" style={{ transitionDelay:'0.3s' }}>
                  <button className="btn-or" onClick={() => setBooking(true)}>{lang==='AR'?'احجزي':'Réserver'}</button>
                </div>
              </div>
            </div>
            <div className="divider-or"/>
          </div>
        ))}
      </section>

      {/* ══ MOODBOARD ══ */}
      <section className="mood-sec rv">
        {moodItems.map((m, i) => (
          <div key={i} className="mood-item">
            <img src={m.img} alt={m.label} />
            <div className="mood-over">
              <div className="mood-label">{m.label}</div>
              <div className="mood-name">{m.name}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ BEFORE / AFTER ══ */}
      <section className="ba-sec">
        <div className="tag rv">{t.ba_tag}</div>
        <h2 className="ba-h rv" style={{ transitionDelay:'0.1s' }}>{t.ba_h}</h2>
        <div className="ba-grid">
          {BA.map((item, i) => (
            <div key={i} className="rv" style={{ transitionDelay:`${i * 0.15}s` }}>
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

      {/* ══ BOOK CTA ══ */}
      <section className="book-sec" id="rdv">
        <div className="tag rv" style={{ justifyContent:'center' }}>{t.book_tag}</div>
        <h2 className="book-h rv" style={{ transitionDelay:'0.1s' }}>{t.book_h}</h2>
        <p className="book-sub rv" style={{ transitionDelay:'0.2s' }}>{t.book_sub}</p>
        <div className="rv" style={{ transitionDelay:'0.3s' }}>
          <button className="btn-or" onClick={() => setBooking(true)}>{t.book_btn}</button>
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section className="contact-sec" id="contact">
        <div className="contact-grid">
          <div>
            <div className="tag rv">{t.contact_tag}</div>
            <h2 className="contact-h rv" style={{ transitionDelay:'0.1s' }}>ADORÉA</h2>
            <div className="contact-sub rv" style={{ transitionDelay:'0.15s' }}>PMU & MAKEUP PRO · CERTIFIED BELGIUM</div>
            {[
              { l:lang==='AR'?'العنوان':lang==='EN'?'Address':'Adresse', v:'PK13 – Bâtiment B1-2\nDjibouti Ville' },
              { l:lang==='AR'?'الهاتف':lang==='EN'?'Phone':'Téléphone', v:'+253 77 59 61 59' },
              { l:'Email', v:'adlina@adorea-dj.com' },
              { l:lang==='AR'?'أوقات العمل':lang==='EN'?'Hours':'Horaires', v:t.hours },
            ].map((item, i) => (
              <div key={i} className={`ci rv`} style={{ transitionDelay:`${0.2 + i * 0.07}s` }}>
                <div className="ci-l">{item.l}</div>
                <div className="ci-v" style={{ whiteSpace:'pre-line' }}>{item.v}</div>
              </div>
            ))}
            <div className="contact-btns rv" style={{ transitionDelay:'0.5s' }}>
              <a href="tel:+25377596159" className="btn-outline">{lang==='AR'?'اتصال':lang==='EN'?'Call':'Appeler'}</a>
              <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="btn-or">WhatsApp</a>
            </div>
          </div>
          <div className="rv-r">
            <div className="map-box">
              <img src="/images/woman-dark.png" alt="ADORÉA Djibouti" />
              <div className="map-pin">📍</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-top">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <LogoMark size={52} />
            <LogoWordmark color={C.blanc} scale={0.75} />
          </div>
          <nav className="footer-links">
            {t.nav.map((item, i) => (
              <a key={i} href={['#hero','#rdv','#sourcils','#levres','#makeup','#nails','#contact'][i]}>{item}</a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">{t.rights}</span>
          <div style={{ display:'flex', gap:12 }}>
            {['ig','tk','fb'].map(s => (
              <a key={s} href="#" style={{ width:34,height:34,borderRadius:'50%',border:'1px solid rgba(251,247,242,0.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(251,247,242,0.3)',fontSize:11,textDecoration:'none',fontFamily:'Montserrat,sans-serif',transition:'all 0.2s' }}>{s}</a>
            ))}
          </div>
        </div>
      </footer>

      {booking && <BookingModal lang={lang} onClose={() => setBooking(false)} />}
    </div>
  )
}
