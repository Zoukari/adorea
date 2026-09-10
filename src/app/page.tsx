'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── TOKENS ────────────────────────────────────────────────────
const C = {
  nude:     '#D7B6B1',
  beige:    '#EADCC8',
  gold:     '#C9A96A',
  black:    '#1A1A1A',
  offwhite: '#F9F6F2',
  muted:    '#8A7A74',
  glass:    'rgba(249,246,242,0.82)',
}

// ─── i18n ───────────────────────────────────────────────────────
const i18n = {
  FR: {
    nav: ['Accueil','Rendez-vous','Sourcils','Lèvres','Makeup','Nails','Contact'],
    certified: 'Certified Belgium',
    hero_sub: 'PMU · Makeup Pro · Nails',
    hero_cta: 'Réserver maintenant',
    hero_cta2: 'Découvrir',
    brand_tag: 'Notre histoire',
    brand_title: "L'art\nde sublimer",
    brand_text: "ADORÉA est un studio beauté premium à Djibouti, spécialisé dans le maquillage permanent, le makeup professionnel et l'art des ongles. Chaque prestation est réalisée avec des pigments certifiés et des techniques maîtrisées en Belgique.",
    services_tag: 'Nos univers',
    gallery_tag: 'Avant · Après',
    gallery_title: 'Les résultats parlent',
    book_tag: 'Réservation',
    book_title: 'Prenez rendez-vous',
    book_sub: 'En quelques secondes, choisissez votre prestation, votre créneau. Nous nous occupons du reste.',
    book_btn: 'Réserver un créneau',
    contact_tag: 'Contact',
    contact_open: 'Lun – Sam · 09h – 19h',
    call: 'Appeler',
    wa: 'WhatsApp',
    rights: '© 2025 ADORÉA. Tous droits réservés.',
    before: 'Avant',
    after: 'Après',
    book: 'Réserver',
    from: 'à partir de',
  },
  EN: {
    nav: ['Home','Book','Brows','Lips','Makeup','Nails','Contact'],
    certified: 'Certified Belgium',
    hero_sub: 'PMU · Makeup Pro · Nails',
    hero_cta: 'Book now',
    hero_cta2: 'Discover',
    brand_tag: 'Our story',
    brand_title: "The art\nof beauty",
    brand_text: 'ADORÉA is a premium beauty studio in Djibouti, specialising in permanent makeup, professional beauty and nail artistry. Every treatment uses certified pigments and techniques mastered in Belgium.',
    services_tag: 'Expertise',
    gallery_tag: 'Before · After',
    gallery_title: 'Results speak',
    book_tag: 'Appointments',
    book_title: 'Book your visit',
    book_sub: 'Choose your service and time slot in seconds. We handle everything else.',
    book_btn: 'Book a slot',
    contact_tag: 'Contact',
    contact_open: 'Mon – Sat · 09:00 – 19:00',
    call: 'Call',
    wa: 'WhatsApp',
    rights: '© 2025 ADORÉA. All rights reserved.',
    before: 'Before',
    after: 'After',
    book: 'Book',
    from: 'from',
  },
  AR: {
    nav: ['الرئيسية','حجز','الحواجب','الشفاه','ميكاب','أظافر','تواصل'],
    certified: 'معتمد بلجيكيًا',
    hero_sub: 'PMU · ميكاب احترافي · أظافر',
    hero_cta: 'احجزي الآن',
    hero_cta2: 'اكتشفي',
    brand_tag: 'قصتنا',
    brand_title: "فن\nالجمال",
    brand_text: 'أدوريا استوديو تجميل فاخر في جيبوتي، متخصص في الوشم التجميلي والمكياج الاحترافي وفن الأظافر. كل خدمة تُنفَّذ بأصباغ معتمدة وتقنيات متقنة في بلجيكا.',
    services_tag: 'تخصصاتنا',
    gallery_tag: 'قبل · بعد',
    gallery_title: 'النتائج تتحدث',
    book_tag: 'الحجز',
    book_title: 'احجزي موعدك',
    book_sub: 'اختاري خدمتك وموعدك في ثوانٍ. نحن نتكفل بالباقي.',
    book_btn: 'احجزي الآن',
    contact_tag: 'تواصل',
    contact_open: 'الإثنين – السبت · ٩ص – ٧م',
    call: 'اتصال',
    wa: 'واتساب',
    rights: '© 2025 ADORÉA. جميع الحقوق محفوظة.',
    before: 'قبل',
    after: 'بعد',
    book: 'احجزي',
    from: 'من',
  },
}

const SERVICES = [
  {
    id: 'brows',
    label: { FR: 'Sourcils PMU', EN: 'Brows PMU', AR: 'حواجب PMU' },
    desc: { FR: 'Powder Brows et Combo Brows — des sourcils naturels, durables, certifiés Belgique.', EN: 'Powder Brows & Combo Brows — natural, long-lasting. Belgian certified.', AR: 'باودر براوز وكومبو براوز — حواجب طبيعية ودائمة. بلجيكية معتمدة.' },
    items: [{ n:'Powder Brows', p:'55 000 FDJ' }, { n:'Combo Brows', p:'60 000 FDJ' }, { n:'Retouche', p:'15 000 FDJ' }],
    img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&q=85',
    bg: '#F5EEE9',
  },
  {
    id: 'lips',
    label: { FR: 'Lèvres PMU', EN: 'Lips PMU', AR: 'شفاه PMU' },
    desc: { FR: 'Candy Lips et neutralisation — des lèvres définies, éclatantes en toutes circonstances.', EN: 'Candy Lips & neutralisation — defined, radiant lips at any moment.', AR: 'كاندي ليبس وتحييد — شفاه محددة ومشرقة في كل لحظة.' },
    items: [{ n:'Candy Lips', p:'60 000 FDJ' }, { n:'Neutralisation', p:'Sur devis' }, { n:'Retouche', p:'30 000 FDJ' }],
    img: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=900&q=85',
    bg: '#F5E9E9',
  },
  {
    id: 'makeup',
    label: { FR: 'Makeup Pro', EN: 'Pro Makeup', AR: 'ميكاب احترافي' },
    desc: { FR: 'Du maquillage jour au grand événement — chaque regard sculpté avec précision.', EN: 'Day looks to grand events — every gaze sculpted with precision.', AR: 'من ميكاب اليوم إلى المناسبات — كل إطلالة تُنحت بدقة.' },
    items: [{ n:'Makeup Jour', p:'5 000 FDJ' }, { n:'Makeup Soirée', p:'6 500 FDJ' }, { n:'Makeup Mariée', p:'13 000 FDJ' }],
    img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=85',
    bg: '#F0EDE5',
  },
  {
    id: 'nails',
    label: { FR: 'Nails', EN: 'Nails', AR: 'أظافر' },
    desc: { FR: 'Manucure classique, semi-permanent et Nail Art — chaque détail compte.', EN: 'Classic, semi-permanent & Nail Art — every detail matters.', AR: 'مانيكير كلاسيك وناي آرت — كل تفصيل مهم.' },
    items: [{ n:'Manucure classique', p:'4 000 FDJ' }, { n:'Semi-Permanent', p:'8 000 FDJ' }, { n:'Nail Art', p:'1 000 FDJ+' }],
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=85',
    bg: '#EDE8E0',
  },
]

const BA_ITEMS = [
  { label: 'Powder Brows', before: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=700&q=85', after: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&q=85' },
  { label: 'Candy Lips',   before: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&q=85', after: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=700&q=85' },
]

// ─── HEALTH ITEMS ───────────────────────────────────────────────
const HEALTH = {
  FR: ['Grossesse','Diabète','Allergies','Traitement médical','Problèmes de peau','Herpès','Anticoagulants'],
  EN: ['Pregnancy','Diabetes','Allergies','Medical treatment','Skin conditions','Herpes','Blood thinners'],
  AR: ['حمل','سكري','حساسية','علاج طبي','مشاكل جلدية','هيرباس','مضادات التخثر'],
}

// ─── CSS ────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Manrope', sans-serif; background: ${C.offwhite}; color: ${C.black}; overflow-x: hidden; -webkit-font-smoothing: antialiased; }

  /* FLOATERS */
  .floaters { position: fixed; top: 20px; right: 20px; z-index: 300; display: flex; flex-direction: column; gap: 8px; }
  [dir=rtl] .floaters { right: auto; left: 20px; }
  .pill { background: ${C.glass}; backdrop-filter: blur(14px); border: 1px solid rgba(201,169,106,0.2); border-radius: 50px; display: flex; gap: 2px; padding: 3px; box-shadow: 0 4px 20px rgba(26,26,26,0.08); }
  .pill button { background: transparent; border: none; border-radius: 30px; cursor: pointer; font-family: 'Manrope',sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; padding: 5px 11px; color: ${C.muted}; transition: all 0.2s ease; }
  .pill button.on { background: ${C.black}; color: ${C.offwhite}; }
  .pill.wa button.on { background: #25D366; color: white; }

  /* ISLAND NAV */
  .island { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 300; background: rgba(26,26,26,0.93); backdrop-filter: blur(20px); border-radius: 100px; padding: 10px 18px; display: flex; gap: 2px; max-width: calc(100vw - 32px); overflow-x: auto; scrollbar-width: none; box-shadow: 0 8px 32px rgba(26,26,26,0.25); }
  .island::-webkit-scrollbar { display: none; }
  .island a { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 12px; font-weight: 500; padding: 7px 13px; border-radius: 50px; white-space: nowrap; transition: all 0.25s ease; }
  .island a:hover, .island a.active { background: rgba(201,169,106,0.18); color: ${C.gold}; }

  /* WA FLOAT */
  .wa-btn { position: fixed; bottom: 96px; right: 24px; z-index: 290; width: 52px; height: 52px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 20px rgba(37,211,102,0.4); transition: transform 0.25s ease, box-shadow 0.25s ease; }
  .wa-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(37,211,102,0.5); }
  [dir=rtl] .wa-btn { right: auto; left: 24px; }

  /* SCROLL REVEAL */
  .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.75s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-left { opacity: 0; transform: translateX(-32px); transition: opacity 0.75s ease, transform 0.75s ease; }
  .reveal-left.visible { opacity: 1; transform: translateX(0); }
  .reveal-right { opacity: 0; transform: translateX(32px); transition: opacity 0.75s ease, transform 0.75s ease; }
  .reveal-right.visible { opacity: 1; transform: translateX(0); }

  /* HERO */
  .hero { position: relative; height: 100svh; min-height: 640px; overflow: hidden; display: flex; align-items: flex-end; border-radius: 0 0 40px 40px; }
  .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 20%; transition: transform 8s ease; }
  .hero-img.loaded { transform: scale(1.04); }
  .hero-grad { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(26,26,26,0.1) 0%, rgba(26,26,26,0.0) 40%, rgba(26,26,26,0.8) 100%); }
  .hero-content { position: relative; z-index: 2; padding: 0 48px 96px; max-width: 700px; }
  @media(max-width:600px){ .hero-content { padding: 0 28px 110px; } }
  .hero-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 18px; opacity: 0; animation: fadeUp 1s 0.3s forwards; }
  .hero-title { font-family: 'Cormorant Garamond',serif; font-size: clamp(64px,11vw,110px); line-height: 0.9; color: ${C.offwhite}; font-weight: 300; margin-bottom: 16px; opacity: 0; animation: fadeUp 1s 0.5s forwards; }
  .hero-sub { font-size: 12px; font-weight: 400; letter-spacing: 0.18em; color: rgba(249,246,242,0.55); margin-bottom: 40px; opacity: 0; animation: fadeUp 1s 0.7s forwards; }
  .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; opacity: 0; animation: fadeUp 1s 0.9s forwards; }

  @keyframes fadeUp { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform: translateY(0); } }

  /* BUTTONS */
  .btn-gold { background: ${C.gold}; color: ${C.black}; border: none; border-radius: 100px; cursor: pointer; font-family: 'Manrope',sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; padding: 15px 32px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s ease; }
  .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,169,106,0.4); }
  .btn-ghost { background: transparent; color: rgba(249,246,242,0.85); border: 1px solid rgba(249,246,242,0.3); border-radius: 100px; cursor: pointer; font-family: 'Manrope',sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; padding: 14px 28px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s ease; }
  .btn-ghost:hover { border-color: rgba(249,246,242,0.7); background: rgba(249,246,242,0.08); }
  .btn-dark { background: ${C.black}; color: ${C.offwhite}; border: none; border-radius: 100px; cursor: pointer; font-family: 'Manrope',sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; padding: 15px 32px; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.25s ease; }
  .btn-dark:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,26,26,0.25); }

  /* SECTION */
  .sec { padding: 100px 48px; }
  @media(max-width:640px){ .sec { padding: 72px 24px; } }
  .tag { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 20px; display: block; }

  /* BRAND */
  .brand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; max-width: 1100px; margin: 0 auto; }
  @media(max-width:800px){ .brand-grid { grid-template-columns: 1fr; gap: 48px; } }
  .brand-title { font-family: 'Cormorant Garamond',serif; font-size: clamp(48px,7vw,80px); font-weight: 300; line-height: 1; white-space: pre-line; margin-bottom: 28px; }
  .brand-text { font-size: 15px; line-height: 1.8; color: ${C.muted}; margin-bottom: 32px; }
  .cert { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border: 1px solid ${C.nude}; border-radius: 100px; }
  .cert span { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; color: ${C.muted}; }
  .brand-img-wrap { border-radius: 32px; overflow: hidden; box-shadow: 0 24px 64px rgba(26,26,26,0.12); }
  .brand-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; transition: transform 0.6s ease; }
  .brand-img-wrap:hover .brand-img { transform: scale(1.04); }

  /* SERVICES */
  .svc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 1200px; margin: 0 auto; }
  @media(max-width:720px){ .svc-grid { grid-template-columns: 1fr; } }
  .svc-card { border-radius: 28px; overflow: hidden; position: relative; cursor: pointer; }
  .svc-img { width: 100%; aspect-ratio: 4/5; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
  .svc-card:hover .svc-img { transform: scale(1.06); }
  .svc-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(26,26,26,0.86) 0%, rgba(26,26,26,0.1) 55%, transparent 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 32px 32px 36px; transition: background 0.3s ease; }
  .svc-card:hover .svc-overlay { background: linear-gradient(to top, rgba(26,26,26,0.92) 0%, rgba(26,26,26,0.2) 60%, transparent 100%); }
  .svc-title { font-family: 'Cormorant Garamond',serif; font-size: 32px; font-weight: 300; color: ${C.offwhite}; margin-bottom: 10px; }
  .svc-desc { font-size: 12px; color: rgba(249,246,242,0.65); line-height: 1.6; margin-bottom: 18px; }
  .svc-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
  .svc-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(249,246,242,0.1); padding-top: 8px; }
  .svc-row-name { font-size: 12px; color: rgba(249,246,242,0.7); }
  .svc-row-price { font-size: 12px; color: ${C.gold}; font-weight: 600; }
  .svc-btn { align-self: flex-start; }

  /* GALLERY / BA SLIDER */
  .gallery-sec { background: ${C.black}; border-radius: 40px; margin: 0 16px; }
  .ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; }
  @media(max-width:640px){ .ba-grid { grid-template-columns: 1fr; } }
  .ba-card { }
  .ba-label { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: ${C.gold}; text-transform: uppercase; margin-bottom: 14px; display: block; }
  .ba-wrap { position: relative; border-radius: 24px; overflow: hidden; cursor: col-resize; user-select: none; touch-action: none; }
  .ba-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
  .ba-after { position: absolute; inset: 0; overflow: hidden; }
  .ba-after img { width: 100%; height: 100%; object-fit: cover; }
  .ba-line { position: absolute; top: 0; bottom: 0; width: 2px; background: ${C.gold}; }
  .ba-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 40px; height: 40px; border-radius: 50%; background: ${C.gold}; display: flex; align-items: center; justify-content: center; color: ${C.black}; font-weight: 700; font-size: 15px; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
  .ba-ends { display: flex; justify-content: space-between; margin-top: 10px; }
  .ba-end { font-size: 10px; letter-spacing: 0.15em; color: rgba(249,246,242,0.3); text-transform: uppercase; }

  /* BOOK CTA */
  .book-sec { background: linear-gradient(135deg, ${C.beige} 0%, #F0E8DE 100%); border-radius: 40px; margin: 0 16px; text-align: center; }
  .book-title { font-family: 'Cormorant Garamond',serif; font-size: clamp(40px,6vw,72px); font-weight: 300; line-height: 1.05; margin-bottom: 20px; }
  .book-sub { font-size: 14px; color: ${C.muted}; line-height: 1.7; max-width: 42ch; margin: 0 auto 44px; }

  /* CONTACT */
  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; max-width: 1000px; margin: 0 auto; align-items: start; }
  @media(max-width:720px){ .contact-grid { grid-template-columns: 1fr; gap: 48px; } }
  .contact-items { display: flex; flex-direction: column; gap: 24px; margin-top: 32px; }
  .ci-label { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 4px; }
  .ci-val { font-size: 15px; color: ${C.black}; }
  .contact-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 36px; }
  .map-box { border-radius: 28px; overflow: hidden; aspect-ratio: 1; position: relative; background: ${C.beige}; }
  .map-box img { width: 100%; height: 100%; object-fit: cover; opacity: 0.65; transition: opacity 0.3s; }
  .map-box:hover img { opacity: 0.8; }
  .map-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-60%); font-size: 36px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }

  /* FOOTER */
  .footer { background: ${C.black}; border-radius: 40px 40px 0 0; margin-top: 16px; padding: 64px 48px 120px; }
  @media(max-width:640px){ .footer { padding: 48px 28px 110px; } }
  .footer-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; margin-bottom: 48px; }
  .footer-logo { font-family: 'Cormorant Garamond',serif; font-size: 30px; font-weight: 300; color: ${C.offwhite}; }
  .footer-sub { font-size: 10px; letter-spacing: 0.18em; color: ${C.muted}; margin-top: 4px; text-transform: uppercase; }
  .footer-links { display: flex; gap: 28px; flex-wrap: wrap; }
  .footer-links a { font-size: 12px; color: rgba(255,255,255,0.38); text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: ${C.gold}; }
  .footer-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 28px; flex-wrap: wrap; gap: 12px; }
  .footer-copy { font-size: 11px; color: rgba(255,255,255,0.2); }
  .socials { display: flex; gap: 12px; }
  .social-ico { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.35); font-size: 13px; text-decoration: none; transition: all 0.2s; }
  .social-ico:hover { border-color: ${C.gold}; color: ${C.gold}; }

  /* BOOKING MODAL */
  .modal-back { position: fixed; inset: 0; background: rgba(26,26,26,0.7); backdrop-filter: blur(8px); z-index: 600; display: flex; align-items: flex-end; justify-content: center; }
  @media(min-width:640px){ .modal-back { align-items: center; } }
  .modal { background: ${C.offwhite}; border-radius: 28px 28px 0 0; width: 100%; max-width: 500px; max-height: 92svh; overflow-y: auto; padding: 36px 32px 52px; animation: slideUp 0.35s cubic-bezier(0.25,0.46,0.45,0.94); }
  @media(min-width:640px){ .modal { border-radius: 28px; } }
  @keyframes slideUp { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
  .step-bar { display: flex; gap: 5px; margin-bottom: 28px; }
  .step-seg { flex: 1; height: 3px; border-radius: 3px; background: ${C.beige}; transition: background 0.3s; }
  .step-seg.done { background: ${C.gold}; }
  .modal-title { font-family: 'Cormorant Garamond',serif; font-size: 30px; font-weight: 300; margin-bottom: 4px; }
  .modal-sub { font-size: 12px; color: ${C.muted}; margin-bottom: 28px; }
  .f-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.muted}; margin-bottom: 7px; display: block; }
  .f-input { width: 100%; padding: 12px 16px; border: 1.5px solid ${C.beige}; border-radius: 14px; font-family: 'Manrope',sans-serif; font-size: 14px; background: white; color: ${C.black}; outline: none; transition: border-color 0.2s; margin-bottom: 18px; }
  .f-input:focus { border-color: ${C.nude}; }
  .svc-pick { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 22px; }
  .svc-opt { padding: 13px 12px; border: 1.5px solid ${C.beige}; border-radius: 16px; background: white; cursor: pointer; text-align: left; transition: all 0.2s; }
  .svc-opt:hover, .svc-opt.sel { border-color: ${C.nude}; background: #FAF5F3; }
  .svc-opt .so-n { font-size: 12px; font-weight: 500; color: ${C.black}; }
  .svc-opt .so-p { font-size: 11px; color: ${C.gold}; margin-top: 3px; }
  .health-list { display: flex; flex-direction: column; gap: 11px; margin-bottom: 22px; }
  .health-item { display: flex; align-items: center; gap: 11px; cursor: pointer; }
  .health-item input { accent-color: ${C.nude}; width: 17px; height: 17px; cursor: pointer; }
  .health-item span { font-size: 14px; }
  .pay-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 24px; }
  .pay-opt { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border: 1.5px solid ${C.beige}; border-radius: 16px; background: white; cursor: pointer; transition: all 0.2s; font-family: 'Manrope',sans-serif; }
  .pay-opt:hover, .pay-opt.sel { border-color: ${C.gold}; background: #FBF7EE; }
  .pay-opt span { font-size: 13px; font-weight: 500; color: ${C.black}; }
  .modal-foot { display: flex; gap: 10px; margin-top: 28px; }
  .btn-back { background: transparent; border: 1.5px solid ${C.beige}; border-radius: 100px; padding: 12px 20px; font-family: 'Manrope',sans-serif; font-size: 12px; cursor: pointer; color: ${C.muted}; transition: border-color 0.2s; }
  .btn-back:hover { border-color: ${C.nude}; }
  .wa-cta { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: 100px; background: #25D366; color: white; text-decoration: none; font-size: 13px; font-weight: 700; margin-top: 14px; transition: all 0.2s; }
  .wa-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,211,102,0.35); }
`

// ─── BEFORE/AFTER SLIDER ────────────────────────────────────────
function BASlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef(false)

  const move = useCallback((clientX: number) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos(Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  useEffect(() => {
    const up = () => { drag.current = false }
    const mv = (e: MouseEvent) => { if (drag.current) move(e.clientX) }
    const tm = (e: TouchEvent) => { if (drag.current) move(e.touches[0].clientX) }
    window.addEventListener('mouseup', up)
    window.addEventListener('mousemove', mv)
    window.addEventListener('touchend', up)
    window.addEventListener('touchmove', tm)
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', mv); window.removeEventListener('touchend', up); window.removeEventListener('touchmove', tm) }
  }, [move])

  return (
    <div className="ba-wrap" ref={ref}
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

// ─── SCROLL REVEAL HOOK ─────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── BOOKING MODAL ──────────────────────────────────────────────
type Lang = 'FR' | 'EN' | 'AR'

function BookingModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = i18n[lang]
  const [step, setStep] = useState(0)
  const [svc, setSvc] = useState<{ name: string; price: string } | null>(null)
  const [health, setHealth] = useState<Record<number, boolean>>({})
  const [pay, setPay] = useState('')
  const hasCI = Object.values(health).some(Boolean)

  const allSvcs = SERVICES.flatMap(s => s.items.map(i => ({ name: i.n, price: i.p, cat: s.label[lang] })))
  const steps = lang === 'AR'
    ? ['الخدمة','الموعد','بياناتك','الصحة','الدفع']
    : lang === 'EN'
    ? ['Service','Date','Details','Health','Payment']
    : ['Prestation','Date','Identité','Santé','Paiement']

  const waMsg = (type: string) => {
    const base = `Bonjour ADORÉA,\n\nPrestation : ${svc?.name}\nRéférence : ADR-${Math.random().toString(36).slice(2,8).toUpperCase()}\n\n`
    if (type === 'health') return base + 'Une information de santé nécessite validation avant confirmation.\n\nMerci.'
    return base + `Montant : ${svc?.price}\n\nJe joins mon screenshot de paiement.`
  }

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Steps */}
        <div className="step-bar">
          {steps.map((_, i) => <div key={i} className={`step-seg${i <= step ? ' done' : ''}`} />)}
        </div>

        <h2 className="modal-title">{steps[step]}</h2>
        <p className="modal-sub">ADORÉA · {t.certified}</p>

        {/* STEP 0 — Prestation */}
        {step === 0 && (
          <div className="svc-pick">
            {allSvcs.map((s, i) => (
              <button key={i} className={`svc-opt${svc?.name === s.name ? ' sel' : ''}`} onClick={() => setSvc(s)}>
                <div className="so-n">{s.name}</div>
                <div className="so-p">{s.price}</div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 1 — Date (placeholder) */}
        {step === 1 && (
          <div style={{ background: C.beige, borderRadius: 20, padding: 28, textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 300, color: C.black, marginBottom: 16 }}>
              {new Date().toLocaleDateString(lang === 'AR' ? 'ar' : lang === 'EN' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {[9,10,11,14,15,16,17,18].map(d => (
                <div key={d} style={{ width: 46, height: 46, borderRadius: 14, background: C.offwhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', fontWeight: 500, border: `1.5px solid ${C.nude}` }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {['09:00','09:30','10:00','11:00','14:00','15:30'].map(h => (
                <div key={h} style={{ padding: '8px 14px', borderRadius: 100, background: C.offwhite, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${C.nude}` }}>{h}</div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Identité */}
        {step === 2 && (
          <>
            <label className="f-label">{lang === 'AR' ? 'الاسم الأول' : lang === 'EN' ? 'First name' : 'Prénom'}</label>
            <input className="f-input" />
            <label className="f-label">{lang === 'AR' ? 'اللقب' : lang === 'EN' ? 'Last name' : 'Nom'}</label>
            <input className="f-input" />
            <label className="f-label">{lang === 'AR' ? 'الهاتف' : lang === 'EN' ? 'Phone' : 'Téléphone'}</label>
            <input className="f-input" type="tel" placeholder="+253..." />
            <label className="f-label">{lang === 'AR' ? 'تاريخ الميلاد' : lang === 'EN' ? 'Date of birth' : 'Date de naissance'}</label>
            <input className="f-input" type="date" />
          </>
        )}

        {/* STEP 3 — Santé */}
        {step === 3 && (
          <>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 20 }}>
              {lang === 'AR' ? 'يرجى الإشارة إلى أي من الحالات التالية :'
               : lang === 'EN' ? 'Please indicate if any of the following apply to you :'
               : 'Indiquez si vous êtes concernée par l\'une des situations suivantes :'}
            </p>
            <div className="health-list">
              {HEALTH[lang].map((item, i) => (
                <label key={i} className="health-item">
                  <input type="checkbox" checked={!!health[i]} onChange={e => setHealth(h => ({ ...h, [i]: e.target.checked }))} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <label className="f-label">{lang === 'AR' ? 'ملاحظات' : lang === 'EN' ? 'Comments' : 'Commentaires'}</label>
            <textarea className="f-input" style={{ resize: 'vertical', minHeight: 72 }} />

            {hasCI && (
              <div style={{ background: '#FFF8E7', border: '1.5px solid #E6A817', borderRadius: 16, padding: 16, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#B8830A', marginBottom: 10 }}>
                  ⚠ {lang === 'AR' ? 'موعدك يتطلب تأكيد الفريق' : lang === 'EN' ? 'Your appointment requires team validation' : 'Votre RDV nécessite validation de l\'équipe'}
                </div>
                <a href={`https://wa.me/25377596159?text=${encodeURIComponent(waMsg('health'))}`} target="_blank" rel="noopener noreferrer" className="wa-cta">
                  💬 {lang === 'AR' ? 'طلب تأكيد' : lang === 'EN' ? 'Request confirmation' : 'Demander confirmation'}
                </a>
              </div>
            )}
          </>
        )}

        {/* STEP 4 — Paiement */}
        {step === 4 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px 0' }}>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 48, fontWeight: 300, color: C.gold }}>{svc?.price}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{svc?.name}</div>
            </div>
            <div className="pay-list">
              {['CAC PAY','WAAFI','D-MONEY','CASH'].map(m => (
                <button key={m} className={`pay-opt${pay === m ? ' sel' : ''}`} onClick={() => setPay(m)}>
                  <span>{m}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>→</span>
                </button>
              ))}
            </div>
            {pay && pay !== 'CASH' && (
              <a href={`https://wa.me/25377596159?text=${encodeURIComponent(waMsg('pay'))}`} target="_blank" rel="noopener noreferrer" className="wa-cta">
                💬 {lang === 'AR' ? 'إرسال إثبات الدفع' : lang === 'EN' ? 'Send payment proof' : 'Envoyer le screenshot'}
              </a>
            )}
          </>
        )}

        {/* Footer modal */}
        <div className="modal-foot">
          {step > 0 && <button className="btn-back" onClick={() => setStep(s => s - 1)}>←</button>}
          <button className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => step < 4 ? setStep(s => s + 1) : onClose()}
            disabled={step === 0 && !svc}>
            {step === 4
              ? (lang === 'AR' ? 'تأكيد' : lang === 'EN' ? 'Confirm' : 'Confirmer')
              : (lang === 'AR' ? 'التالي ←' : lang === 'EN' ? 'Next →' : 'Suivant →')}
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
  const [heroLoaded, setHeroLoaded] = useState(false)
  const t = i18n[lang]
  const dir = lang === 'AR' ? 'rtl' : 'ltr'

  useReveal()

  return (
    <div dir={dir} style={{ minHeight: '100vh' }}>
      <style>{css}</style>

      {/* ── FLOATERS ── */}
      <div className="floaters">
        <div className="pill">
          {(['FR','EN','AR'] as Lang[]).map(l => (
            <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l}</button>
          ))}
        </div>
        <div className="pill wa">
          <button className={waOn ? 'on' : ''} onClick={() => setWaOn(true)}>WA</button>
          <button className={!waOn ? 'on' : ''} onClick={() => setWaOn(false)}>OFF</button>
        </div>
      </div>

      {/* ── WA FLOAT ── */}
      {waOn && (
        <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="wa-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* ── ISLAND NAV ── */}
      <nav className="island">
        {t.nav.map((item, i) => (
          <a key={i} href={['#hero','#rdv','#brows','#lips','#makeup','#nails','#contact'][i]}>
            {item}
          </a>
        ))}
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="hero" id="hero">
        <img
          className={`hero-img${heroLoaded ? ' loaded' : ''}`}
          src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1800&q=90"
          alt="ADORÉA studio"
          onLoad={() => setHeroLoaded(true)}
        />
        <div className="hero-grad" />
        <div className="hero-content">
          <div className="hero-tag">{t.certified}</div>
          <h1 className="hero-title">ADORÉA</h1>
          <p className="hero-sub">{t.hero_sub}</p>
          <div className="hero-btns">
            <button className="btn-gold" onClick={() => setBooking(true)}>{t.hero_cta}</button>
            <a href="#brows" className="btn-ghost">{t.hero_cta2}</a>
          </div>
        </div>
      </section>

      {/* ══════ BRAND ══════ */}
      <section className="sec" id="brand" style={{ background: C.offwhite }}>
        <div className="brand-grid">
          <div className="reveal-left">
            <span className="tag">{t.brand_tag}</span>
            <h2 className="brand-title">{t.brand_title}</h2>
            <p className="brand-text">{t.brand_text}</p>
            <div className="cert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{t.certified}</span>
            </div>
          </div>
          <div className="reveal-right">
            <div className="brand-img-wrap">
              <img className="brand-img" src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=85" alt="Studio ADORÉA" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SERVICES ══════ */}
      <section style={{ background: C.black, padding: '80px 16px', borderRadius: '40px', margin: '0 0 16px' }} id="services">
        <div style={{ textAlign: 'center', marginBottom: 56, padding: '0 32px' }}>
          <span className="tag" style={{ color: C.gold }}>{t.services_tag}</span>
        </div>
        <div className="svc-grid">
          {SERVICES.map((s, idx) => (
            <div key={s.id} id={s.id} className="svc-card reveal" style={{ transitionDelay: `${idx * 0.1}s` }}>
              <img className="svc-img" src={s.img} alt={s.label[lang]} />
              <div className="svc-overlay">
                <h3 className="svc-title">{s.label[lang]}</h3>
                <p className="svc-desc">{s.desc[lang]}</p>
                <div className="svc-items">
                  {s.items.map((item, j) => (
                    <div key={j} className="svc-row">
                      <span className="svc-row-name">{item.n}</span>
                      <span className="svc-row-price">{item.p}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-gold svc-btn" onClick={() => setBooking(true)}>{t.book}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ GALLERY AVANT/APRÈS ══════ */}
      <section className="sec gallery-sec" id="gallery">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="tag">{t.gallery_tag}</span>
          <h2 className="reveal" style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: C.offwhite }}>
            {t.gallery_title}
          </h2>
        </div>
        <div className="ba-grid">
          {BA_ITEMS.map((item, i) => (
            <div key={i} className="ba-card reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <span className="ba-label">{item.label}</span>
              <BASlider before={item.before} after={item.after} />
              <div className="ba-ends">
                <span className="ba-end">{t.before}</span>
                <span className="ba-end">{t.after}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ BOOKING CTA ══════ */}
      <section className="sec book-sec" id="rdv">
        <span className="tag reveal">{t.book_tag}</span>
        <h2 className="book-title reveal">{t.book_title}</h2>
        <p className="book-sub reveal">{t.book_sub}</p>
        <div className="reveal">
          <button className="btn-dark" onClick={() => setBooking(true)}>{t.book_btn}</button>
        </div>
      </section>

      {/* ══════ CONTACT ══════ */}
      <section className="sec" id="contact" style={{ background: C.offwhite }}>
        <div className="contact-grid">
          <div className="reveal-left">
            <span className="tag">{t.contact_tag}</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, marginBottom: 4 }}>ADORÉA</h2>
            <p style={{ fontSize: 11, letterSpacing: '0.15em', color: C.muted }}>PMU · MAKEUP PRO · NAILS</p>
            <div className="contact-items">
              {[
                { l: lang === 'AR' ? 'العنوان' : lang === 'EN' ? 'Address' : 'Adresse', v: 'PK13 – Bâtiment B1-2\nDjibouti Ville' },
                { l: lang === 'AR' ? 'الهاتف' : lang === 'EN' ? 'Phone' : 'Téléphone', v: '+253 77 59 61 59' },
                { l: 'Email', v: 'adlina@adorea-dj.com' },
                { l: lang === 'AR' ? 'أوقات العمل' : lang === 'EN' ? 'Hours' : 'Horaires', v: t.contact_open },
              ].map(item => (
                <div key={item.l}>
                  <div className="ci-label">{item.l}</div>
                  <div className="ci-val" style={{ whiteSpace: 'pre-line' }}>{item.v}</div>
                </div>
              ))}
            </div>
            <div className="contact-btns">
              <a href="tel:+25377596159" className="btn-dark">{t.call}</a>
              <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="btn-gold">{t.wa}</a>
            </div>
          </div>
          <div className="reveal-right">
            <div className="map-box">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=700&q=75" alt="Localisation" />
              <div className="map-pin">📍</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="footer">
        <div className="footer-top">
          <div>
            <div className="footer-logo">ADORÉA</div>
            <div className="footer-sub">PMU · Makeup Pro · Nails · {t.certified}</div>
          </div>
          <nav className="footer-links">
            {t.nav.map((item, i) => (
              <a key={i} href={['#hero','#rdv','#brows','#lips','#makeup','#nails','#contact'][i]}>{item}</a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">{t.rights}</span>
          <div className="socials">
            {['ig','tk','fb'].map(s => <a key={s} href="#" className="social-ico">{s}</a>)}
          </div>
        </div>
      </footer>

      {/* ══════ BOOKING MODAL ══════ */}
      {booking && <BookingModal lang={lang} onClose={() => setBooking(false)} />}
    </div>
  )
}
