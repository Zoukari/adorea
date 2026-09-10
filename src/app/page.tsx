'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── TOKENS ────────────────────────────────────────────────────
const C = {
  nude:     '#D7B6B1',
  beige:    '#EADCC8',
  gold:     '#C9A96A',
  goldDark: '#A8813E',
  black:    '#1A1A1A',
  offwhite: '#F9F6F2',
  muted:    '#8A7A74',
  glass:    'rgba(249,246,242,0.88)',
}

// ─── LOGO SVG (reproduction fidèle du vrai logo ADORÉA) ────────
function LogoMark({ size = 120, dark = false }: { size?: number; dark?: boolean }) {
  const gold = dark ? '#fff' : 'url(#goldGrad)'
  const goldStroke = dark ? 'rgba(255,255,255,0.9)' : 'url(#goldGrad)'
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="60" y1="20" x2="140" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8C97A"/>
          <stop offset="40%" stopColor="#C9A96A"/>
          <stop offset="100%" stopColor="#A8813E"/>
        </linearGradient>
        <linearGradient id="goldGradDark" x1="60" y1="20" x2="140" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8C97A"/>
          <stop offset="100%" stopColor="#C9A96A"/>
        </linearGradient>
      </defs>
      {/* Cercle double */}
      <circle cx="100" cy="100" r="94" stroke={goldStroke} strokeWidth="1.2" fill="none" opacity="0.8"/>
      <circle cx="100" cy="100" r="88" stroke={goldStroke} strokeWidth="0.6" fill="none" opacity="0.5"/>
      {/* Grande jambe gauche du A - diagonale gauche */}
      <path d="M62 155 L95 38" stroke={goldStroke} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Grande jambe droite du A - diagonale droite (face du profil) */}
      <path d="M138 155 L95 38" stroke={gold} strokeWidth="14" strokeLinecap="round" opacity="0.9"/>
      {/* Profil visage (côté droit du A) */}
      <path d="M116 58 C120 62, 124 70, 122 80 C120 88, 115 92, 118 100 C120 106, 122 108, 120 115" 
            stroke={goldStroke} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Nez */}
      <path d="M118 100 C116 104, 114 106, 116 109" 
            stroke={goldStroke} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Lèvres */}
      <path d="M112 115 C115 112, 120 112, 122 115" 
            stroke={goldStroke} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Traverse du A */}
      <path d="M72 118 L128 118" stroke={goldStroke} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Flourish / boucle calligraphique en bas à gauche */}
      <path d="M62 155 C55 158, 45 155, 48 148 C51 141, 62 143, 68 138 C74 133, 72 128, 62 130" 
            stroke={goldStroke} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function LogoText({ color = C.black, size = 1 }: { color?: string; size?: number }) {
  return (
    <div style={{ lineHeight: 1 }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28 * size, fontWeight: 300, color, letterSpacing: '0.25em', textTransform: 'uppercase' }}>ADORÉA</div>
      <div style={{ fontFamily: 'Montserrat, Manrope, sans-serif', fontSize: 9 * size, fontWeight: 300, color, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 * size, opacity: 0.7 }}>PMU & Makeup Pro</div>
    </div>
  )
}

// ─── i18n ───────────────────────────────────────────────────────
type Lang = 'FR' | 'EN' | 'AR'
const T = {
  FR: {
    nav: ['Accueil','Rendez-vous','Sourcils','Lèvres','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    h1a: 'Révèle ta',
    h1b: 'beauté naturelle',
    sub: 'PMU · Makeup Pro · Nails',
    cta1: 'Réserver maintenant',
    cta2: 'Découvrir',
    brand_tag: 'Notre histoire',
    brand_h: "L'art de\nsublimer",
    brand_p: "ADORÉA est un studio beauté premium à Djibouti, spécialisé dans le maquillage permanent, le makeup professionnel et l'art des ongles. Chaque prestation est réalisée avec des pigments certifiés et des techniques maîtrisées en Belgique.",
    svc_tag: 'Nos univers',
    svc_kw: ['PRÉCISION', 'SAVOIR-FAIRE', 'RÉSULTATS NATURELS'],
    ba_tag: 'Avant · Après',
    ba_h: 'Les résultats\nparlent',
    bef: 'Avant', aft: 'Après',
    book_tag: 'Réservation',
    book_h: "Prenez\nrendez-vous",
    book_sub: 'Choisissez votre prestation et votre créneau en quelques secondes.',
    book_btn: 'Réserver un créneau',
    contact_tag: 'Contact',
    call: 'Appeler', wa: 'WhatsApp',
    hours: 'Lun – Sam · 09h – 19h',
    rights: '© 2025 ADORÉA. Tous droits réservés.',
    book: 'Réserver',
  },
  EN: {
    nav: ['Home','Book','Brows','Lips','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    h1a: 'Reveal your',
    h1b: 'natural beauty',
    sub: 'PMU · Makeup Pro · Nails',
    cta1: 'Book now',
    cta2: 'Discover',
    brand_tag: 'Our story',
    brand_h: "The art of\nbeauty",
    brand_p: 'ADORÉA is a premium beauty studio in Djibouti, specialising in permanent makeup, professional beauty and nail artistry. Every treatment uses certified pigments and Belgian techniques.',
    svc_tag: 'Expertise',
    svc_kw: ['PRECISION', 'EXPERTISE', 'NATURAL RESULTS'],
    ba_tag: 'Before · After',
    ba_h: 'Results\nspeak',
    bef: 'Before', aft: 'After',
    book_tag: 'Appointments',
    book_h: "Book your\nappointment",
    book_sub: 'Choose your service and time slot in seconds.',
    book_btn: 'Book a slot',
    contact_tag: 'Contact',
    call: 'Call', wa: 'WhatsApp',
    hours: 'Mon – Sat · 09:00 – 19:00',
    rights: '© 2025 ADORÉA. All rights reserved.',
    book: 'Book',
  },
  AR: {
    nav: ['الرئيسية','حجز','الحواجب','الشفاه','ميكاب','أظافر','تواصل'],
    cert: 'معتمد بلجيكيًا',
    h1a: 'اكشفي',
    h1b: 'جمالك الطبيعي',
    sub: 'PMU · ميكاب احترافي · أظافر',
    cta1: 'احجزي الآن',
    cta2: 'اكتشفي',
    brand_tag: 'قصتنا',
    brand_h: "فن\nالجمال",
    brand_p: 'أدوريا استوديو تجميل فاخر في جيبوتي، متخصص في الوشم التجميلي والمكياج الاحترافي وفن الأظافر. كل خدمة تُنفَّذ بأصباغ معتمدة وتقنيات بلجيكية.',
    svc_tag: 'تخصصاتنا',
    svc_kw: ['دقة', 'خبرة', 'نتائج طبيعية'],
    ba_tag: 'قبل · بعد',
    ba_h: 'النتائج\nتتحدث',
    bef: 'قبل', aft: 'بعد',
    book_tag: 'الحجز',
    book_h: "احجزي\nموعدك",
    book_sub: 'اختاري خدمتك وموعدك في ثوانٍ.',
    book_btn: 'احجزي الآن',
    contact_tag: 'تواصل',
    call: 'اتصال', wa: 'واتساب',
    hours: 'الإثنين – السبت · ٩ص – ٧م',
    rights: '© 2025 ADORÉA. جميع الحقوق محفوظة.',
    book: 'احجزي',
  },
}

// ─── SERVICES ──────────────────────────────────────────────────
const SERVICES = [
  {
    id:'brows', slug:'#brows',
    label: { FR:'Sourcils PMU', EN:'Brows PMU', AR:'حواجب PMU' },
    kw: { FR:'RESTRUCTURATION & EFFET NATUREL', EN:'RESTRUCTURING & NATURAL EFFECT', AR:'إعادة هيكلة وأثر طبيعي' },
    desc: { FR:'Powder Brows et Combo Brows — des sourcils naturels, durables, certifiés Belgique.', EN:'Powder Brows & Combo Brows — natural, long-lasting. Belgian certified.', AR:'باودر براوز وكومبو براوز — حواجب طبيعية ودائمة.' },
    items: [{ n:'Powder Brows', p:'55 000 FDJ' }, { n:'Combo Brows', p:'60 000 FDJ' }, { n:'Retouche 1 mois', p:'15 000 FDJ' }],
    img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1000&q=90',
    orient: 'left',
  },
  {
    id:'lips', slug:'#lips',
    label: { FR:'Lèvres PMU', EN:'Lips PMU', AR:'شفاه PMU' },
    kw: { FR:'COLORATION SUBTILE & LONGUE TENUE', EN:'SUBTLE COLOR & LONG LASTING', AR:'لون خفيف وطويل الأمد' },
    desc: { FR:'Candy Lips et neutralisation — des lèvres définies, éclatantes en toutes circonstances.', EN:'Candy Lips & neutralisation — defined, radiant lips at any moment.', AR:'كاندي ليبس — شفاه محددة ومشرقة في كل لحظة.' },
    items: [{ n:'Candy Lips', p:'60 000 FDJ' }, { n:'Neutralisation', p:'Sur devis' }, { n:'Retouche annuelle', p:'30 000 FDJ' }],
    img: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1000&q=90',
    orient: 'right',
  },
  {
    id:'makeup', slug:'#makeup',
    label: { FR:'Makeup Pro', EN:'Pro Makeup', AR:'ميكاب احترافي' },
    kw: { FR:'POUR TOUTES VOS OCCASIONS', EN:'FOR ALL YOUR OCCASIONS', AR:'لجميع مناسباتك' },
    desc: { FR:'Du maquillage jour au grand événement — chaque regard sculpté avec précision.', EN:'From day looks to grand events — every gaze sculpted with precision.', AR:'من ميكاب اليوم إلى المناسبات الكبرى — كل إطلالة تُنحت بدقة.' },
    items: [{ n:'Makeup Jour', p:'5 000 FDJ' }, { n:'Makeup Soirée', p:'6 500 FDJ' }, { n:'Makeup Mariée', p:'13 000 FDJ' }],
    img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1000&q=90',
    orient: 'left',
  },
  {
    id:'nails', slug:'#nails',
    label: { FR:'Nails', EN:'Nails', AR:'أظافر' },
    kw: { FR:'CHAQUE DÉTAIL COMPTE', EN:'EVERY DETAIL MATTERS', AR:'كل تفصيل مهم' },
    desc: { FR:'Manucure classique, semi-permanent et Nail Art — chaque détail compte.', EN:'Classic, semi-permanent & Nail Art — every detail matters.', AR:'مانيكير كلاسيك وناي آرت — كل تفصيل مهم.' },
    items: [{ n:'Manucure classique', p:'4 000 FDJ' }, { n:'Semi-Permanent', p:'8 000 FDJ' }, { n:'Nail Art', p:'1 000 FDJ+' }],
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1000&q=90',
    orient: 'right',
  },
]

const BA = [
  { label:'Powder Brows', before:'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=700&q=85', after:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&q=85' },
  { label:'Candy Lips',   before:'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&q=85', after:'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=700&q=85' },
]

const HEALTH_ITEMS = {
  FR:['Grossesse','Diabète','Allergies','Traitement médical','Problèmes de peau','Herpès','Anticoagulants'],
  EN:['Pregnancy','Diabetes','Allergies','Medical treatment','Skin conditions','Herpes','Blood thinners'],
  AR:['حمل','سكري','حساسية','علاج طبي','مشاكل جلدية','هيرباس','مضادات التخثر'],
}

// ─── CSS ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@200;300;400;500&family=Manrope:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; overflow-x: hidden; }
body { font-family: 'Montserrat', 'Manrope', sans-serif; background: ${C.black}; color: ${C.black}; overflow-x: hidden; -webkit-font-smoothing: antialiased; }

/* ── FLOATERS ── */
.floaters { position: fixed; top: 22px; right: 22px; z-index: 400; display: flex; flex-direction: column; gap: 8px; }
[dir=rtl] .floaters { right: auto; left: 22px; }
.pill { background: rgba(26,26,26,0.85); backdrop-filter: blur(16px); border: 1px solid rgba(201,169,106,0.25); border-radius: 50px; display: flex; gap: 2px; padding: 3px; }
.pill button { background: transparent; border: none; border-radius: 30px; cursor: pointer; font-family: 'Montserrat',sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.08em; padding: 5px 11px; color: rgba(255,255,255,0.45); transition: all 0.2s; }
.pill button.on { background: ${C.gold}; color: ${C.black}; font-weight: 600; }
.pill.wa button.on { background: #25D366; color: white; }

/* ── ISLAND NAV ── */
.island { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 400; background: rgba(26,26,26,0.92); backdrop-filter: blur(24px); border: 1px solid rgba(201,169,106,0.15); border-radius: 100px; padding: 9px 18px; display: flex; gap: 2px; max-width: calc(100vw - 32px); overflow-x: auto; scrollbar-width: none; }
.island::-webkit-scrollbar { display: none; }
.island a { color: rgba(255,255,255,0.4); text-decoration: none; font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.08em; padding: 7px 13px; border-radius: 50px; white-space: nowrap; transition: all 0.25s; }
.island a:hover, .island a.on { background: rgba(201,169,106,0.15); color: ${C.gold}; }

/* ── WA FLOAT ── */
.wa-fab { position: fixed; bottom: 90px; right: 22px; z-index: 390; width: 52px; height: 52px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 20px rgba(37,211,102,0.45); transition: transform 0.25s, box-shadow 0.25s; }
.wa-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(37,211,102,0.55); }
[dir=rtl] .wa-fab { right: auto; left: 22px; }

/* ── HERO ── */
.hero { position: relative; height: 100svh; min-height: 680px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
.hero-bg { position: absolute; inset: 0; }
.hero-bg img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; transform: scale(1.08); animation: heroZoom 10s ease forwards; }
@keyframes heroZoom { to { transform: scale(1); } }
.hero-grad { position: absolute; inset: 0; background: linear-gradient(170deg, rgba(26,26,26,0.05) 0%, rgba(26,26,26,0.2) 40%, rgba(26,26,26,0.88) 100%); }
.hero-content { position: relative; z-index: 2; padding: 0 56px 104px; }
@media(max-width:640px){ .hero-content { padding: 0 28px 120px; } }

/* HERO LOGO */
.hero-logo { margin-bottom: 32px; opacity: 0; animation: fadeSlideUp 1s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }

/* HERO TITLE */
.hero-kw { font-family: 'Montserrat',sans-serif; font-size: 10px; font-weight: 300; letter-spacing: 0.35em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 20px; opacity: 0; animation: fadeSlideUp 1s 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
.hero-h1 { font-family: 'Cormorant Garamond',serif; font-weight: 300; line-height: 0.95; color: white; margin-bottom: 28px; opacity: 0; animation: fadeSlideUp 1s 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
.hero-h1 .line1 { display: block; font-size: clamp(56px, 9vw, 108px); font-style: italic; }
.hero-h1 .line2 { display: block; font-size: clamp(56px, 9vw, 108px); }
.hero-btns { display: flex; gap: 14px; flex-wrap: wrap; opacity: 0; animation: fadeSlideUp 1s 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }

@keyframes fadeSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }

/* ── DIVIDER ── */
.divider { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 28px 0; background: ${C.black}; }
.divider-line { flex: 1; height: 1px; background: rgba(201,169,106,0.2); max-width: 120px; }
.divider-mark { color: ${C.gold}; font-size: 14px; opacity: 0.7; }

/* ── REVEAL ── */
.rv { opacity: 0; transform: translateY(48px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
.rv.go { opacity: 1; transform: translateY(0); }
.rv-l { opacity: 0; transform: translateX(-48px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
.rv-l.go { opacity: 1; transform: translateX(0); }
.rv-r { opacity: 0; transform: translateX(48px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
.rv-r.go { opacity: 1; transform: translateX(0); }
.rv-sc { opacity: 0; transform: scale(0.94); transition: opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1); }
.rv-sc.go { opacity: 1; transform: scale(1); }

/* ── BRAND ── */
.brand-sec { background: ${C.offwhite}; padding: 120px 56px; }
@media(max-width:700px){ .brand-sec { padding: 80px 28px; } }
.brand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 96px; align-items: center; max-width: 1100px; margin: 0 auto; }
@media(max-width:860px){ .brand-grid { grid-template-columns: 1fr; gap: 56px; } }
.tag { font-family: 'Montserrat',sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.35em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.tag::before { content:''; display:block; width:24px; height:1px; background:${C.gold}; }
.brand-h { font-family: 'Cormorant Garamond',serif; font-size: clamp(52px,7vw,84px); font-weight: 300; line-height: 1; white-space: pre-line; color: ${C.black}; margin-bottom: 32px; }
.brand-p { font-size: 14px; line-height: 1.85; color: ${C.muted}; font-weight: 300; margin-bottom: 36px; max-width: 44ch; }
.cert { display: inline-flex; align-items: center; gap: 12px; padding: 13px 22px; border: 1px solid ${C.nude}; border-radius: 100px; }
.cert-txt { font-family: 'Montserrat',sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.18em; color: ${C.muted}; text-transform: uppercase; }
.brand-img-frame { border-radius: 24px; overflow: hidden; box-shadow: 0 32px 80px rgba(26,26,26,0.18); }
.brand-img-frame img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; transition: transform 0.8s cubic-bezier(0.16,1,0.3,1); }
.brand-img-frame:hover img { transform: scale(1.04); }

/* ── SERVICES ── */
.svc-sec { background: ${C.black}; }
.svc-intro { padding: 96px 56px 64px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 24px; max-width: 1100px; margin: 0 auto; }
@media(max-width:700px){ .svc-intro { padding: 64px 28px 40px; } }
.svc-intro-h { font-family: 'Cormorant Garamond',serif; font-size: clamp(40px,6vw,68px); font-weight: 300; color: white; line-height: 1.05; }
.svc-kws { display: flex; flex-direction: column; gap: 6px; }
.svc-kw { font-family: 'Montserrat',sans-serif; font-size: 9px; font-weight: 300; letter-spacing: 0.3em; color: rgba(255,255,255,0.35); text-transform: uppercase; }
/* Chaque service : full-bleed 50/50 */
.svc-row { display: grid; grid-template-columns: 1fr 1fr; min-height: 540px; }
@media(max-width:768px){ .svc-row { grid-template-columns: 1fr; } }
.svc-row.rev .svc-img-col { order: 2; }
.svc-row.rev .svc-txt-col { order: 1; }
@media(max-width:768px){ .svc-row.rev .svc-img-col, .svc-row.rev .svc-txt-col { order: unset; } }
.svc-img-col { position: relative; overflow: hidden; }
.svc-img-col img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.9s cubic-bezier(0.16,1,0.3,1); }
.svc-img-col:hover img { transform: scale(1.05); }
.svc-txt-col { background: ${C.black}; padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; }
@media(max-width:768px){ .svc-txt-col { padding: 48px 28px; min-height: 420px; } }
.svc-num { font-family: 'Cormorant Garamond',serif; font-size: 80px; font-weight: 300; color: rgba(201,169,106,0.12); line-height: 1; margin-bottom: -16px; }
.svc-title { font-family: 'Cormorant Garamond',serif; font-size: clamp(36px,4vw,52px); font-weight: 300; color: white; margin-bottom: 8px; }
.svc-kwtxt { font-family: 'Montserrat',sans-serif; font-size: 9px; font-weight: 400; letter-spacing: 0.3em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 24px; }
.svc-desc { font-size: 13px; line-height: 1.8; color: rgba(255,255,255,0.55); font-weight: 300; margin-bottom: 32px; max-width: 38ch; }
.svc-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
.svc-item { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); }
.svc-item-n { font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 300; color: rgba(255,255,255,0.6); letter-spacing: 0.05em; }
.svc-item-p { font-size: 11px; font-weight: 500; color: ${C.gold}; font-family: 'Montserrat',sans-serif; }

/* ── BUTTONS ── */
.btn-gold { background: ${C.gold}; color: ${C.black}; border: none; border-radius: 100px; cursor: pointer; font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; padding: 16px 36px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s; text-transform: uppercase; }
.btn-gold:hover { background: #D4B06E; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(201,169,106,0.4); }
.btn-outline-w { background: transparent; color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.3); border-radius: 100px; cursor: pointer; font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 0.15em; padding: 15px 32px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s; text-transform: uppercase; }
.btn-outline-w:hover { border-color: rgba(255,255,255,0.7); }
.btn-outline-dark { background: transparent; color: ${C.black}; border: 1px solid ${C.black}; border-radius: 100px; cursor: pointer; font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; padding: 15px 32px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s; text-transform: uppercase; }
.btn-outline-dark:hover { background: ${C.black}; color: white; }
.btn-dark { background: ${C.black}; color: white; border: none; border-radius: 100px; cursor: pointer; font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; padding: 16px 36px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s; text-transform: uppercase; }
.btn-dark:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,26,26,0.3); }

/* ── GALLERY BA ── */
.ba-sec { background: ${C.offwhite}; padding: 120px 56px; }
@media(max-width:640px){ .ba-sec { padding: 80px 28px; } }
.ba-h { font-family: 'Cormorant Garamond',serif; font-size: clamp(48px,7vw,80px); font-weight: 300; color: ${C.black}; line-height: 0.95; white-space: pre-line; margin-bottom: 64px; }
.ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
@media(max-width:640px){ .ba-grid { grid-template-columns: 1fr; } }
.ba-label { font-family: 'Montserrat',sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.3em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
.ba-label::before { content:''; display:block; width:20px; height:1px; background:${C.gold}; }
.ba-slider { position: relative; border-radius: 20px; overflow: hidden; cursor: col-resize; user-select: none; touch-action: none; box-shadow: 0 16px 48px rgba(26,26,26,0.12); }
.ba-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
.ba-after { position: absolute; inset: 0; overflow: hidden; }
.ba-after img { width: 100%; height: 100%; object-fit: cover; }
.ba-line { position: absolute; top: 0; bottom: 0; width: 2px; background: white; opacity: 0.8; }
.ba-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 44px; height: 44px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; color: ${C.black}; font-size: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
.ba-ends { display: flex; justify-content: space-between; margin-top: 12px; }
.ba-end { font-family: 'Montserrat',sans-serif; font-size: 9px; letter-spacing: 0.25em; color: ${C.muted}; text-transform: uppercase; }

/* ── MOODBOARD ── */
.mood-sec { background: ${C.black}; padding: 0; overflow: hidden; }
.mood-strip { display: flex; gap: 3px; }
.mood-item { flex: 1; min-width: 180px; position: relative; overflow: hidden; }
.mood-item img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.4s; filter: brightness(0.75) saturate(0.9); }
.mood-item:hover img { transform: scale(1.06); filter: brightness(0.9) saturate(1.1); }
.mood-item-over { position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 20px; background: linear-gradient(to top, rgba(26,26,26,0.9) 0%, transparent 100%); }
.mood-item-txt { font-family: 'Montserrat',sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.3em; color: rgba(255,255,255,0.6); text-transform: uppercase; }
.mood-item-logo { font-family: 'Cormorant Garamond',serif; font-size: 18px; font-weight: 300; color: white; letter-spacing: 0.2em; margin-top: 4px; }

/* ── BOOK CTA ── */
.book-sec { background: ${C.offwhite}; padding: 140px 56px; text-align: center; position: relative; overflow: hidden; }
@media(max-width:640px){ .book-sec { padding: 96px 28px; } }
.book-sec::before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,169,106,0.08) 0%, transparent 70%); pointer-events:none; }
.book-h { font-family: 'Cormorant Garamond',serif; font-size: clamp(52px,8vw,96px); font-weight: 300; color: ${C.black}; line-height: 0.95; white-space: pre-line; margin-bottom: 28px; }
.book-sub { font-family: 'Montserrat',sans-serif; font-size: 13px; font-weight: 300; color: ${C.muted}; line-height: 1.8; max-width: 40ch; margin: 0 auto 52px; }

/* ── CONTACT ── */
.contact-sec { background: ${C.black}; padding: 120px 56px; }
@media(max-width:700px){ .contact-sec { padding: 80px 28px; } }
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 96px; max-width: 1000px; margin: 0 auto; align-items: start; }
@media(max-width:768px){ .contact-grid { grid-template-columns: 1fr; gap: 56px; } }
.contact-tag { font-family: 'Montserrat',sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.35em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.contact-tag::before { content:''; display:block; width:24px; height:1px; background:${C.gold}; }
.contact-h { font-family: 'Cormorant Garamond',serif; font-size: 48px; font-weight: 300; color: white; line-height: 1; margin-bottom: 6px; }
.contact-sub { font-family: 'Montserrat',sans-serif; font-size: 9px; letter-spacing: 0.25em; color: rgba(255,255,255,0.35); text-transform: uppercase; margin-bottom: 48px; }
.ci { margin-bottom: 28px; }
.ci-l { font-family: 'Montserrat',sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.25em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 6px; }
.ci-v { font-size: 14px; color: rgba(255,255,255,0.75); font-weight: 300; line-height: 1.5; }
.contact-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 40px; }
.map-frame { border-radius: 20px; overflow: hidden; position: relative; }
.map-frame img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; filter: brightness(0.65) saturate(0.8); transition: filter 0.4s; }
.map-frame:hover img { filter: brightness(0.75) saturate(1); }
.map-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-60%); font-size: 36px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4)); }

/* ── FOOTER ── */
.footer { background: ${C.black}; border-top: 1px solid rgba(255,255,255,0.06); padding: 64px 56px 120px; }
@media(max-width:640px){ .footer { padding: 48px 28px 110px; } }
.footer-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 40px; margin-bottom: 56px; }
.footer-links { display: flex; gap: 28px; flex-wrap: wrap; }
.footer-links a { font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 300; letter-spacing: 0.08em; color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: ${C.gold}; }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 28px; flex-wrap: wrap; gap: 12px; }
.footer-copy { font-family: 'Montserrat',sans-serif; font-size: 10px; font-weight: 300; color: rgba(255,255,255,0.18); }

/* ── MODAL ── */
.modal-back { position: fixed; inset: 0; background: rgba(10,8,6,0.82); backdrop-filter: blur(12px); z-index: 700; display: flex; align-items: flex-end; justify-content: center; }
@media(min-width:640px){ .modal-back { align-items: center; } }
.modal { background: ${C.offwhite}; border-radius: 28px 28px 0 0; width: 100%; max-width: 500px; max-height: 93svh; overflow-y: auto; padding: 36px 32px 52px; animation: modalUp 0.4s cubic-bezier(0.16,1,0.3,1); }
@media(min-width:640px){ .modal { border-radius: 28px; } }
@keyframes modalUp { from { opacity:0; transform:translateY(32px) scale(0.98); } to { opacity:1; transform:none; } }
.steps { display: flex; gap: 5px; margin-bottom: 32px; }
.step { flex: 1; height: 2px; border-radius: 2px; background: #E0D8D0; transition: background 0.35s; }
.step.done { background: ${C.gold}; }
.modal-h { font-family: 'Cormorant Garamond',serif; font-size: 30px; font-weight: 300; color: ${C.black}; margin-bottom: 4px; }
.modal-sub { font-family: 'Montserrat',sans-serif; font-size: 10px; letter-spacing: 0.2em; color: ${C.muted}; text-transform: uppercase; margin-bottom: 28px; }
.f-lbl { font-family: 'Montserrat',sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.muted}; margin-bottom: 7px; display: block; }
.f-in { width: 100%; padding: 13px 16px; border: 1.5px solid #E0D8D0; border-radius: 14px; font-family: 'Montserrat',sans-serif; font-size: 13px; font-weight: 300; background: white; color: ${C.black}; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
.f-in:focus { border-color: ${C.nude}; }
.svc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 22px; }
.svc-opt { padding: 14px 13px; border: 1.5px solid #E0D8D0; border-radius: 16px; background: white; cursor: pointer; text-align: left; transition: all 0.2s; }
.svc-opt.sel, .svc-opt:hover { border-color: ${C.nude}; background: #FAF5F3; }
.svc-opt .on { font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 500; color: ${C.black}; }
.svc-opt .op { font-size: 10px; color: ${C.gold}; margin-top: 3px; font-family: 'Montserrat',sans-serif; }
.health-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.hitem { display: flex; align-items: center; gap: 11px; cursor: pointer; }
.hitem input { accent-color: ${C.nude}; width: 17px; height: 17px; cursor: pointer; }
.hitem span { font-family: 'Montserrat',sans-serif; font-size: 13px; font-weight: 300; }
.pay-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 22px; }
.pay-opt { display: flex; justify-content: space-between; align-items: center; padding: 15px 16px; border: 1.5px solid #E0D8D0; border-radius: 16px; background: white; cursor: pointer; transition: all 0.2s; }
.pay-opt.sel, .pay-opt:hover { border-color: ${C.gold}; background: #FBF7EE; }
.pay-opt span { font-family: 'Montserrat',sans-serif; font-size: 12px; font-weight: 400; color: ${C.black}; }
.modal-foot { display: flex; gap: 10px; margin-top: 28px; }
.btn-back-m { background: transparent; border: 1.5px solid #E0D8D0; border-radius: 100px; padding: 12px 20px; font-family: 'Montserrat',sans-serif; font-size: 11px; cursor: pointer; color: ${C.muted}; transition: border-color 0.2s; }
.wa-action { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: 100px; background: #25D366; color: white; text-decoration: none; font-family: 'Montserrat',sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 12px; transition: all 0.2s; }
.wa-action:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,211,102,0.35); }
`

// ─── BEFORE/AFTER ───────────────────────────────────────────────
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
      <div className="ba-after" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={after} alt="après" />
      </div>
      <div className="ba-line" style={{ left: `${pos}%` }}>
        <div className="ba-handle">⟺</div>
      </div>
    </div>
  )
}

// ─── SCROLL REVEAL ──────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('go'); obs.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.rv,.rv-l,.rv-r,.rv-sc').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── BOOKING MODAL ──────────────────────────────────────────────
function BookingModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = T[lang]
  const [step, setStep] = useState(0)
  const [svc, setSvc]   = useState<{ name: string; price: string } | null>(null)
  const [health, setHealth] = useState<Record<number, boolean>>({})
  const [pay, setPay]   = useState('')
  const hasCI = Object.values(health).some(Boolean)
  const allSvcs = SERVICES.flatMap(s => s.items.map(i => ({ name: i.n, price: i.p })))
  const steps5 = lang === 'AR'
    ? ['الخدمة','الموعد','بياناتك','الصحة','الدفع']
    : lang === 'EN' ? ['Service','Date','Details','Health','Payment']
    : ['Prestation','Date','Identité','Santé','Paiement']
  const waMsg = (type: string) => {
    const base = `Bonjour ADORÉA,\n\nPrestation : ${svc?.name || '—'}\nRéférence : ADR-${Math.random().toString(36).slice(2,8).toUpperCase()}\n\n`
    return type === 'health'
      ? base + 'Une information de santé nécessite validation avant confirmation.\n\nMerci.'
      : base + `Montant : ${svc?.price || '—'}\n\nJe joins mon screenshot de paiement.`
  }
  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="steps">{steps5.map((_, i) => <div key={i} className={`step${i <= step ? ' done' : ''}`}/>)}</div>
        <h2 className="modal-h">{steps5[step]}</h2>
        <p className="modal-sub">ADORÉA · {t.cert}</p>

        {step === 0 && (
          <div className="svc-grid">
            {allSvcs.map((s, i) => (
              <button key={i} className={`svc-opt${svc?.name === s.name ? ' sel' : ''}`} onClick={() => setSvc(s)}>
                <div className="on">{s.name}</div>
                <div className="op">{s.price}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ background: '#F5F0EA', borderRadius: 20, padding: 28, marginBottom: 8 }}>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, fontWeight:300, color:C.black, textAlign:'center', marginBottom:20 }}>
              {new Date().toLocaleDateString(lang === 'AR' ? 'ar' : lang === 'EN' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {[9,10,11,14,15,16,17,18].map(d => (
                <div key={d} style={{ width:44, height:44, borderRadius:12, background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, cursor:'pointer', fontWeight:400, border:`1.5px solid #E0D8D0`, fontFamily:'Montserrat,sans-serif' }}>{d}</div>
              ))}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:16 }}>
              {['09:00','09:30','10:00','11:00','14:00','15:30'].map(h => (
                <div key={h} style={{ padding:'8px 16px', borderRadius:100, background:'white', fontSize:11, fontWeight:400, cursor:'pointer', border:`1.5px solid #E0D8D0`, fontFamily:'Montserrat,sans-serif' }}>{h}</div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            {(['Prénom','Nom','Téléphone'].map((l, i) => (
              <div key={i}><label className="f-lbl">{l}</label><input className="f-in" type={i===2?'tel':'text'} /></div>
            )))}
            <label className="f-lbl">Date de naissance</label>
            <input className="f-in" type="date" />
          </>
        )}

        {step === 3 && (
          <>
            <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:12, fontWeight:300, color:C.muted, lineHeight:1.7, marginBottom:20 }}>
              {lang==='AR' ? 'يرجى الإشارة إلى أي من الحالات التالية :' : lang==='EN' ? 'Please indicate if any of the following apply :' : 'Indiquez si vous êtes concernée par l\'une des situations suivantes :'}
            </p>
            <div className="health-list">
              {HEALTH_ITEMS[lang].map((item, i) => (
                <label key={i} className="hitem">
                  <input type="checkbox" checked={!!health[i]} onChange={e => setHealth(h => ({ ...h, [i]: e.target.checked }))} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            {hasCI && (
              <div style={{ background:'#FFF8E7', border:'1.5px solid #E6A817', borderRadius:16, padding:16 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:11, fontWeight:500, color:'#B8830A', marginBottom:10 }}>⚠ Validation de l&apos;équipe ADORÉA requise</div>
                <a href={`https://wa.me/25377596159?text=${encodeURIComponent(waMsg('health'))}`} target="_blank" rel="noopener noreferrer" className="wa-action">
                  💬 Demander confirmation
                </a>
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ textAlign:'center', padding:'16px 0 24px' }}>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:52, fontWeight:300, color:C.gold }}>{svc?.price}</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:11, color:C.muted, marginTop:4, letterSpacing:'0.1em' }}>{svc?.name}</div>
            </div>
            <div className="pay-list">
              {['CAC PAY','WAAFI','D-MONEY','CASH'].map(m => (
                <button key={m} className={`pay-opt${pay===m?' sel':''}`} onClick={() => setPay(m)}>
                  <span>{m}</span><span style={{ fontSize:10, color:C.muted }}>→</span>
                </button>
              ))}
            </div>
            {pay && pay !== 'CASH' && (
              <a href={`https://wa.me/25377596159?text=${encodeURIComponent(waMsg('pay'))}`} target="_blank" rel="noopener noreferrer" className="wa-action">
                💬 Envoyer le screenshot de paiement
              </a>
            )}
          </>
        )}

        <div className="modal-foot">
          {step > 0 && <button className="btn-back-m" onClick={() => setStep(s => s - 1)}>←</button>}
          <button className="btn-gold" style={{ flex:1, justifyContent:'center' }}
            onClick={() => step < 4 ? setStep(s => s + 1) : onClose()}
            disabled={step === 0 && !svc}>
            {step === 4 ? (lang==='AR'?'تأكيد':lang==='EN'?'Confirm':'Confirmer') : (lang==='AR'?'التالي ←':lang==='EN'?'Next →':'Suivant →')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>('FR')
  const [waOn, setWaOn] = useState(true)
  const [booking, setBooking] = useState(false)
  const t = T[lang]
  const dir = lang === 'AR' ? 'rtl' : 'ltr'

  useReveal()

  // Moodboard images (inspirations depuis le vrai moodboard)
  const moodImgs = [
    { src:'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=85', txt:'MAKEUP PRO' },
    { src:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=85', txt:'SOURCILS PMU' },
    { src:'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=85', txt:'BEAUTÉ DURABLE' },
    { src:'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=85', txt:'NAILS' },
    { src:'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&q=85', txt:'LÈVRES PMU' },
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
          <a key={i} href={['#hero','#rdv','#brows','#lips','#makeup','#nails','#contact'][i]}>{item}</a>
        ))}
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1800&q=90" alt="ADORÉA" />
        </div>
        <div className="hero-grad" />
        <div className="hero-content">
          {/* Logo réel */}
          <div className="hero-logo" style={{ display:'flex', alignItems:'center', gap:20 }}>
            <LogoMark size={80} dark />
            <LogoText color="white" size={0.85} />
          </div>
          <div className="hero-kw">{t.cert}</div>
          <h1 className="hero-h1">
            <span className="line1">{t.h1a}</span>
            <span className="line2">{t.h1b}</span>
          </h1>
          <div className="hero-btns">
            <button className="btn-gold" onClick={() => setBooking(true)}>{t.cta1}</button>
            <a href="#brows" className="btn-outline-w">{t.cta2}</a>
          </div>
        </div>
      </section>

      {/* ══════════════ BRAND ══════════════ */}
      <section className="brand-sec" id="brand">
        <div className="brand-grid">
          <div>
            <div className="tag rv">{t.brand_tag}</div>
            <h2 className="brand-h rv" style={{ transitionDelay:'0.1s' }}>{t.brand_h}</h2>
            <p className="brand-p rv" style={{ transitionDelay:'0.2s' }}>{t.brand_p}</p>
            <div className="cert rv" style={{ transitionDelay:'0.3s' }}>
              <LogoMark size={32} />
              <span className="cert-txt">{t.cert}</span>
            </div>
          </div>
          <div className="rv-r">
            <div className="brand-img-frame">
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=85" alt="Studio ADORÉA" />
            </div>
          </div>
        </div>
      </section>

      <div className="divider"><div className="divider-line"/><div className="divider-mark">✦</div><div className="divider-line"/></div>

      {/* ══════════════ SERVICES ══════════════ */}
      <section className="svc-sec" id="services">
        <div className="svc-intro">
          <div>
            <div className="tag rv" style={{ color: C.gold }}>
              <span style={{ color: C.gold }}>{t.svc_tag}</span>
            </div>
            <h2 className="svc-intro-h rv" style={{ transitionDelay:'0.1s' }}>
              {t.svc_tag === 'Nos univers' ? 'Nos univers' : t.svc_tag === 'Expertise' ? 'Expertise' : 'تخصصاتنا'}
            </h2>
          </div>
          <div className="svc-kws rv">
            {t.svc_kw.map((k, i) => <div key={i} className="svc-kw" style={{ transitionDelay: `${0.1 * i}s` }}>{k}</div>)}
          </div>
        </div>

        {SERVICES.map((s, idx) => (
          <div key={s.id} id={s.id} className={`svc-row${s.orient === 'right' ? ' rev' : ''}`}>
            <div className="svc-img-col rv-sc" style={{ transitionDelay: `${idx * 0.05}s` }}>
              <img src={s.img} alt={s.label[lang]} />
            </div>
            <div className="svc-txt-col">
              <div className="svc-num rv" style={{ transitionDelay:'0.1s' }}>0{idx + 1}</div>
              <h3 className="svc-title rv" style={{ transitionDelay:'0.15s' }}>{s.label[lang]}</h3>
              <div className="svc-kwtxt rv" style={{ transitionDelay:'0.2s' }}>{s.kw[lang]}</div>
              <p className="svc-desc rv" style={{ transitionDelay:'0.25s' }}>{s.desc[lang]}</p>
              <div className="svc-items rv" style={{ transitionDelay:'0.3s' }}>
                {s.items.map((item, j) => (
                  <div key={j} className="svc-item">
                    <span className="svc-item-n">{item.n}</span>
                    <span className="svc-item-p">{item.p}</span>
                  </div>
                ))}
              </div>
              <div className="rv" style={{ transitionDelay:'0.35s' }}>
                <button className="btn-gold" onClick={() => setBooking(true)}>{t.book}</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══════════════ MOODBOARD ══════════════ */}
      <section className="mood-sec rv-sc">
        <div className="mood-strip">
          {moodImgs.map((m, i) => (
            <div key={i} className="mood-item">
              <img src={m.src} alt={m.txt} />
              <div className="mood-item-over">
                <div className="mood-item-txt">{m.txt}</div>
                <div className="mood-item-logo">ADORÉA</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ BEFORE / AFTER ══════════════ */}
      <section className="ba-sec" id="gallery">
        <div className="rv">
          <div className="tag">{t.ba_tag}</div>
          <h2 className="ba-h">{t.ba_h}</h2>
        </div>
        <div className="ba-grid">
          {BA.map((item, i) => (
            <div key={i} className="rv" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="ba-label">{item.label}</div>
              <BASlider before={item.before} after={item.after} />
              <div className="ba-ends">
                <span className="ba-end">{t.bef}</span>
                <span className="ba-end">{t.aft}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ BOOK CTA ══════════════ */}
      <section className="book-sec" id="rdv">
        <div className="rv"><div className="tag" style={{ justifyContent:'center' }}>{t.book_tag}</div></div>
        <h2 className="book-h rv" style={{ transitionDelay:'0.1s' }}>{t.book_h}</h2>
        <p className="book-sub rv" style={{ transitionDelay:'0.2s' }}>{t.book_sub}</p>
        <div className="rv" style={{ transitionDelay:'0.3s' }}>
          <button className="btn-dark" onClick={() => setBooking(true)}>{t.book_btn}</button>
        </div>
      </section>

      {/* ══════════════ CONTACT ══════════════ */}
      <section className="contact-sec" id="contact">
        <div className="contact-grid">
          <div>
            <div className="contact-tag rv">{t.contact_tag}</div>
            <h2 className="contact-h rv" style={{ transitionDelay:'0.1s' }}>ADORÉA</h2>
            <div className="contact-sub rv" style={{ transitionDelay:'0.15s' }}>PMU & MAKEUP PRO · CERTIFIED BELGIUM</div>
            {[
              { l: lang==='AR'?'العنوان':lang==='EN'?'Address':'Adresse', v:'PK13 – Bâtiment B1-2\nDjibouti Ville' },
              { l: lang==='AR'?'الهاتف':lang==='EN'?'Phone':'Téléphone', v:'+253 77 59 61 59' },
              { l:'Email', v:'adlina@adorea-dj.com' },
              { l: lang==='AR'?'أوقات العمل':lang==='EN'?'Hours':'Horaires', v: t.hours },
            ].map((item, i) => (
              <div key={i} className={`ci rv`} style={{ transitionDelay: `${0.2 + i * 0.07}s` }}>
                <div className="ci-l">{item.l}</div>
                <div className="ci-v" style={{ whiteSpace:'pre-line' }}>{item.v}</div>
              </div>
            ))}
            <div className="contact-btns rv" style={{ transitionDelay:'0.5s' }}>
              <a href="tel:+25377596159" className="btn-outline-w">{t.call}</a>
              <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="btn-gold">{t.wa}</a>
            </div>
          </div>
          <div className="rv-r">
            <div className="map-frame">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=700&q=75" alt="Djibouti Ville" />
              <div className="map-pin">📍</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="footer">
        <div className="footer-top">
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <LogoMark size={56} />
            <LogoText color="white" size={0.75} />
          </div>
          <nav className="footer-links">
            {t.nav.map((item, i) => (
              <a key={i} href={['#hero','#rdv','#brows','#lips','#makeup','#nails','#contact'][i]}>{item}</a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">{t.rights}</span>
          <div style={{ display:'flex', gap:12 }}>
            {['ig','tk','fb'].map(s => (
              <a key={s} href="#" style={{ width:34, height:34, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:11, textDecoration:'none', fontFamily:'Montserrat,sans-serif', transition:'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=C.gold; (e.currentTarget as HTMLElement).style.color=C.gold }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.3)' }}
              >{s}</a>
            ))}
          </div>
        </div>
      </footer>

      {booking && <BookingModal lang={lang} onClose={() => setBooking(false)} />}
    </div>
  )
}
