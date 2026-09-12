'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

const C = {
  noir:    '#0A0807',
  brun:    '#1C1410',
  or:      '#C9A96A',
  orClair: '#E2C07A',
  orFonce: '#9A7840',
  creme:   '#F4EAD8',
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
    cta1: 'Réserver maintenant', cta2: 'Découvrir',
    brand_tag: 'La beauté de Djibouti aux mains d\'expertes',
    brand_h: 'Art\nBeauté\nConfiance',
    brand_kw: ['ÉLÉGANCE','TECHNIQUE','BEAUTÉ DURABLE'],
    svc_tag: 'NOS PRESTATIONS',
    svc_sub: 'Expertise & précision — résultats naturels',
    gallery_tag: 'NOS UNIVERS',
    ba_tag: 'AVANT · APRÈS', ba_h: 'Les résultats\nparlent',
    book_tag: 'RÉSERVATION', book_h: 'Prenez\nrendez-vous',
    book_sub: 'Votre experte confirme sous 24h.',
    book_btn: 'Réserver un créneau',
    contact_tag: 'NOUS TROUVER',
    hours: 'Lun – Sam · 09h – 19h',
    rights: '© 2025 ADORÉA. Tous droits réservés.',
    bef: 'Avant', aft: 'Après',
    next: 'Suivant', prev: 'Retour',
    book_step: ['Soin','Date & Heure','Vos infos','Santé & Consentement','Paiement'],
    consent_title: 'Consentement & Instructions',
    consent_text: 'Je certifie avoir pris connaissance des contre-indications et accepte la réalisation de la prestation.\n\n📋 Instructions après prestation — Pendant 7 jours :\n• Ne pas mouiller la zone\n• Éviter sauna, piscine, soleil\n• Ne pas gratter\n• Éviter maquillage sur la zone\n\nUne retouche est recommandée après cicatrisation.',
    consent_check: 'J\'ai lu et j\'accepte les conditions et instructions post-prestation',
    confirmed_msg: '✅ Votre rendez-vous est confirmé ! Votre experte vous recontactera pour confirmer le créneau.',
    ci_msg: 'ℹ️ Votre rendez-vous nécessite une validation de l\'experte avant confirmation définitive.',
  },
  EN: {
    nav: ['Home','Book','Brows','Lips','Makeup','Nails','Contact'],
    cert: 'Certified Belgium',
    tagline: 'BEAUTY · CONFIDENCE · YOU',
    h1a: 'Reveal your beauty,', h1b: 'affirm your confidence',
    cta1: 'Book now', cta2: 'Discover',
    brand_tag: 'Djibouti beauty in expert hands',
    brand_h: 'Art\nBeauty\nConfidence',
    brand_kw: ['ELEGANCE','TECHNIQUE','LASTING BEAUTY'],
    svc_tag: 'OUR SERVICES', svc_sub: 'Expertise & precision — natural results',
    gallery_tag: 'OUR UNIVERSE',
    ba_tag: 'BEFORE · AFTER', ba_h: 'Results\nspeak',
    book_tag: 'BOOKING', book_h: 'Book your\nappointment',
    book_sub: 'Your expert confirms within 24h.',
    book_btn: 'Book a slot',
    contact_tag: 'FIND US', hours: 'Mon – Sat · 09:00 – 19:00',
    rights: '© 2025 ADORÉA. All rights reserved.',
    bef: 'Before', aft: 'After',
    next: 'Next', prev: 'Back',
    book_step: ['Service','Date & Time','Your info','Health & Consent','Payment'],
    consent_title: 'Consent & Instructions',
    consent_text: 'I certify having read the contra-indications and agree to the treatment.\n\n📋 Post-treatment instructions — For 7 days:\n• Do not wet the area\n• Avoid sauna, pool, sun\n• Do not scratch\n• Avoid makeup on the area\n\nA touch-up is recommended after healing.',
    consent_check: 'I have read and accept the conditions and post-treatment instructions',
    confirmed_msg: '✅ Your appointment is confirmed! Your expert will contact you to confirm the time slot.',
    ci_msg: 'ℹ️ Your appointment requires expert validation before final confirmation.',
  },
  AR: {
    nav: ['الرئيسية','حجز','الحواجب','الشفاه','ميكاب','أظافر','تواصل'],
    cert: 'معتمد بلجيكيًا',
    tagline: 'جمال · ثقة · أنتِ',
    h1a: 'اكشفي جمالك،', h1b: 'أكدي ثقتك بنفسك',
    cta1: 'احجزي الآن', cta2: 'اكتشفي',
    brand_tag: 'جمال جيبوتي بأيدي خبيرات',
    brand_h: 'فن\nجمال\nثقة',
    brand_kw: ['أناقة','تقنية','جمال دائم'],
    svc_tag: 'خدماتنا', svc_sub: 'خبرة ودقة — نتائج طبيعية',
    gallery_tag: 'عالمنا',
    ba_tag: 'قبل · بعد', ba_h: 'النتائج\nتتحدث',
    book_tag: 'الحجز', book_h: 'احجزي\nموعدك',
    book_sub: 'خبيرتك تؤكد خلال 24 ساعة.',
    book_btn: 'احجزي الآن',
    contact_tag: 'موقعنا', hours: 'الإثنين – السبت · ٩ص – ٧م',
    rights: '© 2025 ADORÉA. جميع الحقوق محفوظة.',
    bef: 'قبل', aft: 'بعد',
    next: 'التالي', prev: 'رجوع',
    book_step: ['الخدمة','التاريخ','بياناتك','الصحة والموافقة','الدفع'],
    consent_title: 'الموافقة والتعليمات',
    consent_text: 'أقر بأنني اطلعت على موانع الخدمة وأوافق على إجراء العلاج.\n\n📋 تعليمات ما بعد الخدمة — لمدة 7 أيام:\n• عدم ابتلال المنطقة\n• تجنب الساونا والمسبح والشمس\n• عدم الحك\n• تجنب المكياج على المنطقة\n\nيُنصح بجلسة ريتوش بعد الشفاء.',
    consent_check: 'لقد قرأتُ وأوافق على الشروط وتعليمات ما بعد الخدمة',
    confirmed_msg: '✅ تم تأكيد موعدك! ستتواصل معكِ الخبيرة لتأكيد الوقت.',
    ci_msg: 'ℹ️ يحتاج موعدك إلى مراجعة الخبيرة قبل التأكيد النهائي.',
  },
}

const SERVICES = [
  {
    id:'sourcils', cat:'PMU — Sourcils',
    label:{ FR:'Sourcils PMU', EN:'Brows PMU', AR:'حواجب PMU' },
    desc:{ FR:'Restructuration et définition naturelle du regard. Powder Brows, Combo Brows — résultat naturel et durable.', EN:'Natural brow restructuring. Powder Brows, Combo Brows — lasting results.', AR:'إعادة هيكلة طبيعية للحواجب.' },
    items:[{name:'Powder Brows',devis:false},{name:'Combo Brows',devis:false},{name:'Retouche 1 mois',devis:false},{name:'Retouche annuelle (9–15 mois)',devis:false},{name:'Retouche (après 15 mois)',devis:true}],
    img:'/images/pmu-brows.png', kw:'PRÉCISION · RÉSULTATS NATURELS', bg:C.noir,
  },
  {
    id:'levres', cat:'PMU — Lèvres',
    label:{ FR:'Lèvres PMU', EN:'Lips PMU', AR:'شفاه PMU' },
    desc:{ FR:'Lèvres subtilement colorées et définies — Candy Lips longue tenue.', EN:'Subtly colored and defined lips — Candy Lips, long lasting.', AR:'شفاه محددة ومعرّفة بشكل خفيف.' },
    items:[{name:'Candy Lips',devis:false},{name:'Retouche annuelle (9–15 mois)',devis:false},{name:'Retouche (après 15 mois)',devis:true}],
    img:'/images/levres-closeup.png', kw:'COLORATION SUBTILE · LONGUE TENUE', bg:C.brun,
  },
  {
    id:'makeup', cat:'Makeup Pro',
    label:{ FR:'Makeup Pro', EN:'Pro Makeup', AR:'ميكاب احترافي' },
    desc:{ FR:'Maquillage professionnel pour toutes vos occasions. Du quotidien au mariage.', EN:'Professional makeup for all occasions. From daily to wedding.', AR:'مكياج احترافي لجميع مناسباتك.' },
    items:[{name:'Makeup Jour',devis:false},{name:'Makeup Soirée',devis:false},{name:'Makeup Mariée',devis:false},{name:'Essai Mariée',devis:false},{name:'Shooting / Event',devis:true}],
    img:'/images/makeup-profile.png', kw:'DES REGARDS QUI MARQUENT', bg:'#120E0A',
  },
  {
    id:'nails', cat:'Nails',
    label:{ FR:'Nails', EN:'Nails', AR:'أظافر' },
    desc:{ FR:'Manucure classique, semi-permanent et Nail Art — élégance au bout des ongles.', EN:'Classic manicure, semi-permanent and Nail Art.', AR:'مانيكير كلاسيك، شبه دائم وناي آرت.' },
    items:[{name:'Manucure classique',devis:false},{name:'Semi-Permanent',devis:false},{name:'Semi-Permanent French',devis:false},{name:'Pédicure simple',devis:false},{name:'Pédicure semi-permanent',devis:false},{name:'Nail Art',devis:false}],
    img:'/images/nails-hero.png', kw:'ÉLÉGANCE AU BOUT DES ONGLES', bg:C.brun,
  },
]

// Gallery horizontale scroll
const GALLERY_ITEMS = [
  { img:'/images/gallery-makeup.png',  label:'MAKEUP PRO', name:'Pour vos grands moments' },
  { img:'/images/gallery-levres.png',  label:'LÈVRES PMU', name:'Des lèvres sublimées' },
  { img:'/images/gallery-nails.png',   label:'NAILS',      name:'Élégance au bout des ongles' },
  { img:'/images/gallery-sourcils.png',label:'SOURCILS PMU',name:'Précision & savoir-faire' },
  { img:'/images/hero-main.png',       label:'STUDIO',     name:'ADORÉA Djibouti' },
]

const HEALTH_ITEMS = {
  FR:['Grossesse','Diabète','Allergies','Traitement médical en cours','Problèmes de peau','Herpès (labial ou autre)','Anticoagulants'],
  EN:['Pregnancy','Diabetes','Allergies','Ongoing medical treatment','Skin conditions','Herpes','Blood thinners'],
  AR:['حمل','سكري','حساسية','علاج طبي حالي','مشاكل جلدية','هيرباس','مضادات التخثر'],
}

const BA = [
  { label:'Sourcils PMU', before:'/images/ba-before-1.png', after:'/images/ba-after-1.png' },
  { label:'Lèvres PMU',   before:'/images/ba-after-2.png', after:'/images/ba-before-2.png' },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Montserrat',sans-serif;background:#0A0807;color:#FAF6F0;overflow-x:hidden;-webkit-font-smoothing:antialiased}

/* ── VIEWPORT FIX ── */
:root{--vw:100vw}

/* ── TOGGLES DROITE ── */
.toggles-right{position:fixed;bottom:28px;right:20px;z-index:400;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
[dir=rtl] .toggles-right{right:auto;left:20px;align-items:flex-start}

/* Langue dropdown */
.lang-btn{background:rgba(10,8,7,0.92);backdrop-filter:blur(20px);border:1px solid rgba(201,169,106,0.22);border-radius:50px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.1em;padding:7px 16px;color:#C9A96A;display:flex;align-items:center;gap:6px;transition:border-color 0.2s}
.lang-btn:hover{border-color:rgba(201,169,106,0.5)}
.lang-btn svg{transition:transform 0.25s}
.lang-btn.open svg{transform:rotate(180deg)}
.lang-dropdown{position:absolute;bottom:calc(100% + 8px);right:0;background:rgba(10,8,7,0.97);backdrop-filter:blur(24px);border:1px solid rgba(201,169,106,0.15);border-radius:16px;overflow:hidden;display:none;flex-direction:column;min-width:90px}
.lang-dropdown.open{display:flex}
.lang-dropdown button{background:transparent;border:none;border-bottom:1px solid rgba(201,169,106,0.07);cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:400;letter-spacing:0.12em;padding:11px 18px;color:rgba(250,246,240,0.45);transition:all 0.15s;text-align:left}
.lang-dropdown button:last-child{border-bottom:none}
.lang-dropdown button:hover,.lang-dropdown button.on{color:#C9A96A;background:rgba(201,169,106,0.06)}
.lang-dropdown button.on{font-weight:600}

/* WA pill */
.wa-pill{background:rgba(10,8,7,0.92);backdrop-filter:blur(20px);border:1px solid rgba(37,211,102,0.2);border-radius:50px;display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;transition:all 0.25s}
.wa-pill.on{border-color:rgba(37,211,102,0.5);background:rgba(37,211,102,0.08)}
.wa-pill-icon{width:20px;height:20px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.wa-pill-label{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.12em;color:rgba(250,246,240,0.45);text-transform:uppercase}
.wa-pill.on .wa-pill-label{color:#25D366}

/* ── ISLAND NAV ── */
.island{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:400;backdrop-filter:blur(24px);border-radius:100px;padding:8px 18px;display:flex;gap:1px;max-width:calc(100vw - 180px);overflow-x:auto;scrollbar-width:none;transition:background 0.5s ease,border-color 0.5s ease,box-shadow 0.5s ease;box-shadow:0 8px 32px rgba(0,0,0,0.25)}
.island::-webkit-scrollbar{display:none}
.island.dark{background:rgba(10,8,7,0.95);border:1.5px solid rgba(201,169,106,0.35)}
.island.light{background:rgba(244,234,216,0.96);border:1.5px solid rgba(154,120,64,0.4);box-shadow:0 8px 32px rgba(0,0,0,0.12)}
.island a,.island a:link,.island a:visited{text-decoration:none;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.08em;padding:6px 11px;border-radius:50px;white-space:nowrap;transition:all 0.2s;flex-shrink:0;color:rgba(250,246,240,0.3)}
.island.dark a,.island.dark a:link,.island.dark a:visited{color:rgba(250,246,240,0.42)}
.island.light a,.island.light a:link,.island.light a:visited{color:rgba(28,20,16,0.5)}
.island.dark a:hover,.island.dark a.on{background:rgba(201,169,106,0.16);color:#E2C07A}
.island.light a:hover,.island.light a.on{background:rgba(154,120,64,0.14);color:#9A7840}

/* ── WA FAB ── */
.wa-fab{position:fixed;bottom:80px;right:20px;z-index:390;width:50px;height:50px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 4px 20px rgba(37,211,102,0.35);transition:transform 0.2s,opacity 0.3s,visibility 0.3s}
.wa-fab:hover{transform:scale(1.08)}
.wa-fab.off{opacity:0;visibility:hidden}
[dir=rtl] .wa-fab{right:auto;left:20px}

/* ── TRANSITIONS MOKARY — FADE PUR ── */
.rv{opacity:0;transition:opacity 1.1s cubic-bezier(0.16,1,0.3,1)}
.rv.go{opacity:1}
.rv-l{opacity:0;transform:translateX(-20px);transition:opacity 1s cubic-bezier(0.16,1,0.3,1),transform 1s cubic-bezier(0.16,1,0.3,1)}
.rv-l.go{opacity:1;transform:none}
.rv-r{opacity:0;transform:translateX(20px);transition:opacity 1s cubic-bezier(0.16,1,0.3,1),transform 1s cubic-bezier(0.16,1,0.3,1)}
.rv-r.go{opacity:1;transform:none}

/* ── HERO ── */
.hero{position:relative;height:100svh;min-height:640px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.hero-bg{position:absolute;inset:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;object-position:center 20%;animation:hZoom 14s ease forwards}
@media(max-width:640px){.hero-bg img{object-position:center center}}
@keyframes hZoom{from{transform:scale(1.06)}to{transform:scale(1)}}
.hero-grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,8,7,0.1) 0%,rgba(10,8,7,0) 20%,rgba(10,8,7,0.5) 60%,rgba(10,8,7,0.97) 100%)}
.hero-content{position:relative;z-index:2;padding:0 52px 108px}
.hero-logo-wrap{display:flex;align-items:center;gap:16px;margin-bottom:40px;opacity:0;animation:fadeIn 1.2s 0.3s ease forwards}
.hero-tag{font-size:9px;font-weight:300;letter-spacing:0.42em;color:#C9A96A;text-transform:uppercase;margin-bottom:18px;opacity:0;animation:fadeIn 1.2s 0.6s ease forwards}
.hero-h1{font-family:'Cormorant Garamond',serif;font-weight:300;color:#FAF6F0;margin-bottom:36px}
.hero-line{overflow:hidden;display:block}
.hero-line-inner{display:block;transform:translateY(108%);animation:heroLineUp 1.05s cubic-bezier(0.16,1,0.3,1) forwards;font-size:clamp(38px,6vw,80px);line-height:1.05}
.hero-line:nth-child(1) .hero-line-inner{animation-delay:0.85s;font-style:italic;color:rgba(250,246,240,0.65)}
.hero-line:nth-child(2) .hero-line-inner{animation-delay:1.0s;font-weight:300}
@keyframes heroLineUp{to{transform:translateY(0)}}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap;opacity:0;animation:fadeIn 1.2s 1.1s ease forwards}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* ── TAG ── */
.tag{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:#C9A96A;display:flex;align-items:center;gap:14px}
.tag::before,.tag::after{content:'';display:block;height:1px;background:currentColor;width:28px;flex-shrink:0}
.tag.na::after{display:none}
.tag.dark-tag{color:#9A7840}

/* ── BUTTONS ── */
.btn-or{background:#C9A96A;color:#0A0807;border:none;border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;padding:14px 34px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;text-transform:uppercase;transition:background 0.2s,transform 0.2s,box-shadow 0.2s}
.btn-or:hover{background:#E2C07A;transform:translateY(-1px);box-shadow:0 6px 24px rgba(201,169,106,0.3)}
.btn-or:disabled{opacity:0.25;cursor:not-allowed;transform:none;box-shadow:none}
.btn-outline{background:transparent;color:#FAF6F0;border:1px solid rgba(250,246,240,0.2);border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.2em;padding:13px 30px;text-decoration:none;display:inline-flex;align-items:center;text-transform:uppercase;transition:border-color 0.2s}
.btn-outline:hover{border-color:rgba(250,246,240,0.55)}
.btn-outline-d{background:transparent;color:#FAF6F0;border:1px solid rgba(250,246,240,0.18);border-radius:100px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;letter-spacing:0.15em;padding:12px 24px;text-decoration:none;display:inline-flex;align-items:center;text-transform:uppercase;transition:border-color 0.2s}
.btn-outline-d:hover{border-color:rgba(250,246,240,0.5)}

/* ── BRAND ── */
.brand-sec{background:#F4EAD8}
.brand-inner{display:grid;grid-template-columns:1fr 1fr;min-height:100svh}
.brand-img-col{overflow:hidden;min-height:400px;position:relative}
.brand-img-col img{width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block;transition:transform 1.2s cubic-bezier(0.16,1,0.3,1)}
.brand-img-col:hover img{transform:scale(1.04)}
.brand-txt-col{padding:80px 60px;display:flex;flex-direction:column;justify-content:center;background:#F4EAD8}
.brand-h{font-family:'Cormorant Garamond',serif;font-size:clamp(50px,6vw,84px);font-weight:300;line-height:1;color:#0A0807;white-space:pre-line;margin:20px 0 28px}
.brand-p{font-size:13px;font-weight:300;line-height:1.9;color:#7A5C42;max-width:42ch;margin-bottom:32px}
.brand-kws{display:flex;flex-direction:column;gap:9px;margin-bottom:34px}
.brand-kw-item{font-size:9px;font-weight:500;letter-spacing:0.3em;color:#9A7840;text-transform:uppercase}

/* ── SERVICES ── */
.svc-sec{background:#0A0807}
.svc-header{text-align:center;padding:88px 48px 68px}
.svc-header-h{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,58px);font-weight:300;color:#FAF6F0;margin-top:20px}
.svc-row{display:grid;grid-template-columns:1fr 1fr;min-height:560px}
.svc-row.rev .svc-img-col{order:2}.svc-row.rev .svc-txt-col{order:1}
.svc-img-col{overflow:hidden;min-height:380px;position:relative}
.svc-img-col img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transition:transform 1.2s cubic-bezier(0.16,1,0.3,1)}
.svc-img-col:hover img{transform:scale(1.05)}
.svc-txt-col{padding:68px 56px;display:flex;flex-direction:column;justify-content:center}
.svc-num{font-family:'Cormorant Garamond',serif;font-size:76px;font-weight:300;color:rgba(201,169,106,0.07);line-height:1;margin-bottom:-10px}
.svc-cat-lbl{font-size:9px;font-weight:600;letter-spacing:0.35em;color:#C9A96A;margin-bottom:10px;text-transform:uppercase}
.svc-title{font-family:'Cormorant Garamond',serif;font-size:clamp(30px,3.5vw,46px);font-weight:300;color:#FAF6F0;margin-bottom:9px}
.svc-kwtxt{font-size:8px;font-weight:400;letter-spacing:0.28em;color:rgba(201,169,106,0.45);text-transform:uppercase;margin-bottom:22px}
.svc-desc{font-size:13px;font-weight:300;line-height:1.85;color:rgba(250,246,240,0.45);margin-bottom:26px;max-width:38ch}
.svc-list{display:flex;flex-direction:column;gap:9px;margin-bottom:36px}
.svc-list-item{display:flex;align-items:center;gap:11px;font-size:12px;font-weight:300;color:rgba(250,246,240,0.55)}
.svc-list-item::before{content:'';width:14px;height:1px;background:#C9A96A;flex-shrink:0}
.svc-devis{font-size:9px;color:#C9A96A;margin-left:5px;opacity:0.65}
.svc-sep{height:1px;background:linear-gradient(90deg,rgba(201,169,106,0.15),transparent)}

/* ── GALLERY SCROLL ── */
.gallery-sec{background:#0A0807;padding:80px 0}
.gallery-header{padding:0 52px 44px;text-align:center}
.gallery-track-wrap{overflow:hidden;position:relative}
.gallery-track-wrap::before,.gallery-track-wrap::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none}
.gallery-track-wrap::before{left:0;background:linear-gradient(to right,#0A0807,transparent)}
.gallery-track-wrap::after{right:0;background:linear-gradient(to left,#0A0807,transparent)}
.gallery-track{display:flex;gap:14px;padding:0 52px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;cursor:grab;user-select:none;-webkit-overflow-scrolling:touch}
.gallery-track::-webkit-scrollbar{display:none}
.gallery-track.dragging{cursor:grabbing}
.gallery-card{flex:0 0 250px;scroll-snap-align:start;position:relative;border-radius:18px;overflow:hidden;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1)}
.gallery-card:hover{transform:scale(1.02)}
.gallery-card img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;transition:transform 0.8s cubic-bezier(0.16,1,0.3,1);filter:brightness(0.7) saturate(0.85)}
.gallery-card:hover img{transform:scale(1.06);filter:brightness(0.88) saturate(1)}
.gallery-card-over{position:absolute;bottom:0;left:0;right:0;padding:18px 14px;background:linear-gradient(to top,rgba(10,8,7,0.88) 0%,transparent 100%)}
.gallery-card-tag{font-size:8px;font-weight:600;letter-spacing:0.3em;color:#C9A96A;text-transform:uppercase;margin-bottom:3px}
.gallery-card-name{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:300;color:#FAF6F0}
.gallery-dots{display:flex;justify-content:center;gap:5px;margin-top:22px}
.gallery-dot{width:5px;height:5px;border-radius:50%;background:rgba(201,169,106,0.22);transition:all 0.3s;cursor:pointer}
.gallery-dot.on{background:#C9A96A;width:20px;border-radius:3px}

/* ── BEFORE AFTER ── */
.ba-sec{background:#F4EAD8;padding:108px 52px}
.ba-h{font-family:'Cormorant Garamond',serif;font-size:clamp(42px,6vw,70px);font-weight:300;color:#0A0807;white-space:pre-line;margin:20px 0 60px;line-height:0.95}
.ba-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.ba-lbl{font-size:9px;font-weight:600;letter-spacing:0.3em;color:#9A7840;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:10px}
.ba-lbl::before{content:'';width:18px;height:1px;background:currentColor}
.ba-slider{position:relative;border-radius:18px;overflow:hidden;cursor:col-resize;user-select:none;touch-action:none;box-shadow:0 16px 48px rgba(10,8,7,0.12)}
.ba-img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
.ba-after{position:absolute;inset:0;overflow:hidden}
.ba-after img{width:100%;height:100%;object-fit:cover}
.ba-line{position:absolute;top:0;bottom:0;width:2px;background:#FAF6F0}
.ba-handle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:#FAF6F0;display:flex;align-items:center;justify-content:center;color:#0A0807;font-size:13px;box-shadow:0 3px 12px rgba(0,0,0,0.18)}
.ba-ends{display:flex;justify-content:space-between;margin-top:9px}
.ba-end{font-size:9px;letter-spacing:0.25em;color:#7A5C42;text-transform:uppercase}

/* ── BOOK CTA ── */
.book-sec{background:#0A0807;padding:128px 52px;text-align:center;position:relative;overflow:hidden}
.book-sec::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 100%,rgba(201,169,106,0.05) 0%,transparent 70%);pointer-events:none}
.book-h{font-family:'Cormorant Garamond',serif;font-size:clamp(50px,8vw,94px);font-weight:300;color:#FAF6F0;white-space:pre-line;line-height:0.95;margin:20px 0 22px}
.book-sub{font-size:13px;font-weight:300;color:rgba(250,246,240,0.35);line-height:1.8;max-width:40ch;margin:0 auto 44px}

/* ── CONTACT ── */
.contact-sec{background:#1C1410;padding:108px 52px}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:88px;max-width:1000px;margin:0 auto}
.contact-h{font-family:'Cormorant Garamond',serif;font-size:46px;font-weight:300;color:#FAF6F0;margin:20px 0 6px}
.contact-sub{font-size:9px;letter-spacing:0.22em;color:rgba(250,246,240,0.2);text-transform:uppercase;margin-bottom:42px}
.ci-info{margin-bottom:24px}
.ci-lbl{font-size:8px;font-weight:600;letter-spacing:0.28em;color:#C9A96A;text-transform:uppercase;margin-bottom:5px}
.ci-val{font-size:13px;font-weight:300;color:rgba(250,246,240,0.6);line-height:1.6}
.contact-btns{display:flex;gap:11px;flex-wrap:wrap;margin-top:34px}
.social-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.soc-link{display:flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid rgba(250,246,240,0.12);border-radius:100px;text-decoration:none;color:rgba(250,246,240,0.42);font-family:'Montserrat',sans-serif;font-size:10px;font-weight:300;transition:all 0.2s}
.soc-link:hover{border-color:#C9A96A;color:#C9A96A}
.map-box{border-radius:18px;overflow:hidden}
.map-box iframe{width:100%;aspect-ratio:1;display:block;border:none;filter:grayscale(0.15) brightness(0.82)}

/* ── FOOTER ── */
.footer{background:#0A0807;border-top:1px solid rgba(201,169,106,0.07);padding:56px 52px 40px}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:32px;margin-bottom:40px}
.footer-links a{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;letter-spacing:0.07em;color:rgba(250,246,240,0.18);text-decoration:none;transition:color 0.2s;margin-right:22px}
.footer-links a:hover{color:#C9A96A}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(250,246,240,0.04);padding-top:20px;flex-wrap:wrap;gap:10px}
.footer-copy{font-size:10px;font-weight:300;color:rgba(250,246,240,0.12)}

/* ── FADE-SEP ── */
.fade-sep{height:1px;background:linear-gradient(90deg,transparent,rgba(201,169,106,0.12),transparent)}

/* ── MODAL ── */
.modal-back{position:fixed;inset:0;background:rgba(5,4,3,0.9);backdrop-filter:blur(14px);z-index:700;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:640px){.modal-back{align-items:center}}
.modal{background:#FAF6F0;border-radius:28px 28px 0 0;width:100%;max-width:520px;max-height:93svh;overflow-y:auto;padding:36px 30px 52px;animation:mUp 0.4s cubic-bezier(0.16,1,0.3,1);position:relative}
@media(min-width:640px){.modal{border-radius:28px}}
@keyframes mUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
.modal-close{position:absolute;top:16px;right:18px;width:30px;height:30px;border-radius:50%;background:#EDE5D8;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;color:#7A5C42;transition:all 0.2s}
.modal-close:hover{background:#E0D5C5;color:#0A0807}
.steps-bar{display:flex;gap:4px;margin-bottom:26px;margin-right:38px}
.step-seg{flex:1;height:2px;border-radius:2px;background:#E0D5C5;transition:background 0.35s}
.step-seg.done{background:#C9A96A}
.modal-h{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:300;color:#0A0807;margin-bottom:3px}
.modal-sub{font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:0.22em;color:#7A5C42;text-transform:uppercase;margin-bottom:24px}
.f-lbl{font-family:'Montserrat',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#7A5C42;margin-bottom:6px;display:block}
.f-in{width:100%;padding:12px 15px;border:1.5px solid #DDD0BE;border-radius:13px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;background:white;color:#0A0807;outline:none;transition:border-color 0.2s;margin-bottom:13px}
.f-in:focus{border-color:#C9956A}
.f-in.err{border-color:#E88}
.f-ta{width:100%;padding:12px 15px;border:1.5px solid #DDD0BE;border-radius:13px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;background:white;color:#0A0807;outline:none;resize:vertical;min-height:76px;margin-bottom:13px;transition:border-color 0.2s}
.f-ta:focus{border-color:#C9956A}
.cat-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px}
.cat-tab{padding:7px 15px;border-radius:100px;border:1.5px solid #DDD0BE;background:white;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.1em;color:#7A5C42;transition:all 0.2s;text-transform:uppercase}
.cat-tab.on{background:#0A0807;border-color:#0A0807;color:#FAF6F0}
.pick-list{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.pick-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border:1.5px solid #DDD0BE;border-radius:14px;background:white;cursor:pointer;transition:all 0.2s;text-align:left;width:100%}
.pick-item:hover,.pick-item.on{border-color:#C9956A;background:#FBF5EE}
.rdot{width:17px;height:17px;border-radius:50%;border:2px solid #C5B8A5;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.pick-item.on .rdot{background:#C9A96A;border-color:#C9A96A}
.pick-item.on .rdot::after{content:'';width:5px;height:5px;border-radius:50%;background:white}
.pick-name{font-size:13px;font-weight:400;color:#0A0807}
.pick-cat{font-size:10px;color:#7A5C42;margin-top:2px}
.pick-devis-badge{font-size:9px;color:#C9A96A;margin-left:4px;font-weight:500}
.cal-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.cal-nav{background:transparent;border:1.5px solid #DDD0BE;border-radius:9px;width:30px;height:30px;cursor:pointer;font-size:13px;color:#7A5C42;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.cal-nav:hover{border-color:#C9956A;color:#0A0807}
.cal-ml{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:300;color:#0A0807;text-transform:capitalize}
.cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px}
.cal-dl{text-align:center;font-size:9px;font-weight:600;letter-spacing:0.07em;color:#7A5C42;padding:3px 0;text-transform:uppercase}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:14px}
.cal-d{width:100%;aspect-ratio:1;border-radius:9px;border:none;background:transparent;cursor:default;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:300;color:#C0B09A;display:flex;align-items:center;justify-content:center}
.cal-d.av{background:#FBF5EE;color:#0A0807;cursor:pointer;border:1.5px solid transparent;transition:all 0.15s}
.cal-d.av:hover{border-color:#C9956A}
.cal-d.sel{background:#0A0807;color:#FAF6F0;border-color:#0A0807}
.slots-g{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.slot{padding:7px 14px;border-radius:100px;border:1.5px solid #DDD0BE;background:white;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;color:#0A0807;transition:all 0.15s}
.slot:hover{border-color:#C9956A}
.slot.on{background:#0A0807;border-color:#0A0807;color:#FAF6F0}
.cal-note{font-size:10px;color:#7A5C42;line-height:1.6;font-weight:300}
.h-list{display:flex;flex-direction:column;gap:7px;margin-bottom:13px}
.h-item{display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 11px;border-radius:11px;transition:background 0.15s}
.h-item:hover{background:#FBF5EE}
.h-chk{width:16px;height:16px;accent-color:#C9956A;cursor:pointer;flex-shrink:0}
.h-lbl{font-family:'Montserrat',sans-serif;font-size:13px;font-weight:300;color:#0A0807}
.ci-box{background:#FFFBF0;border:1.5px solid #9A7840;border-radius:15px;padding:15px;margin-bottom:13px}
.ci-box-h{font-size:11px;font-weight:600;color:#9A7840;margin-bottom:7px;font-family:'Montserrat',sans-serif}
.ci-box-p{font-size:12px;font-weight:300;color:#7A5C2A;line-height:1.65;font-family:'Montserrat',sans-serif}
.ci-items{margin:5px 0;font-size:12px;color:#8A6030;font-family:'Montserrat',sans-serif}
.ci-items li{margin-left:14px;margin-top:3px}
.consent-box{background:#F8F4EE;border:1.5px solid #DDD0BE;border-radius:15px;padding:16px;margin-bottom:14px}
.consent-text{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:300;color:#7A5C42;line-height:1.75;white-space:pre-line;margin-bottom:14px}
.consent-check-wrap{display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:11px;background:white;border-radius:11px;border:1.5px solid #DDD0BE;transition:all 0.2s}
.consent-check-wrap:hover{border-color:#C9956A}
.consent-check-wrap.checked{border-color:#C9A96A;background:#FBF5EE}
.consent-chk{width:17px;height:17px;accent-color:#C9A96A;cursor:pointer;flex-shrink:0;margin-top:1px}
.consent-lbl{font-family:'Montserrat',sans-serif;font-size:12px;font-weight:400;color:#0A0807;line-height:1.5}
.confirm-banner{padding:14px;border-radius:12px;margin-bottom:13px;font-family:'Montserrat',sans-serif;font-size:12px;line-height:1.65;font-weight:300}
.confirm-ok{background:#F0FFF4;border:1.5px solid #4CAF50;color:#2E7D32}
.confirm-ci{background:#FFFBF0;border:1.5px solid #9A7840;color:#7A5C2A}
.pay-list{display:flex;flex-direction:column;gap:7px;margin-bottom:13px}
.pay-opt{display:flex;align-items:flex-start;gap:12px;padding:13px;border:1.5px solid #DDD0BE;border-radius:14px;background:white;cursor:pointer;transition:all 0.2s;text-align:left;width:100%}
.pay-opt:hover,.pay-opt.on{border-color:#C9956A;background:#FBF5EE}
.pay-name{font-size:13px;font-weight:500;color:#0A0807;margin-bottom:2px}
.pay-desc{font-size:11px;font-weight:300;color:#7A5C42;line-height:1.5;font-family:'Montserrat',sans-serif}
.recap-box{background:#FBF5EE;border-radius:13px;padding:13px 15px;margin-bottom:13px}
.recap-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #EAE0D0;font-family:'Montserrat',sans-serif;font-size:12px}
.recap-row:last-child{border-bottom:none}
.modal-foot{display:flex;gap:9px;margin-top:18px}
.btn-prev-m{background:transparent;border:1.5px solid #DDD0BE;border-radius:100px;padding:11px 18px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:400;cursor:pointer;color:#7A5C42;transition:border-color 0.2s;letter-spacing:0.1em}
.btn-prev-m:hover{border-color:#C9956A}

/* ── LIGNE REVEAL (masque, style Mokary) ── */
.line-mask{display:block;overflow:hidden}
.line-mask-inner{display:block;transform:translateY(105%);transition:transform 1.05s cubic-bezier(0.16,1,0.3,1)}
.line-mask.go .line-mask-inner{transform:translateY(0)}

/* ── SECTION NUMBER STYLE MOKARY ── */
.sec-num{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:300;font-style:italic;opacity:0.55;margin-right:10px;letter-spacing:0}

/* ── GLASS EFFECTS (verre dépoli) ── */
.glass-chip{background:rgba(250,246,240,0.06);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border:1px solid rgba(250,246,240,0.16);border-radius:100px}
.glass-chip-light{background:rgba(10,8,7,0.05);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border:1px solid rgba(10,8,7,0.1);border-radius:100px}
.glass-card{background:rgba(250,246,240,0.045);backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);border:1px solid rgba(250,246,240,0.12);border-radius:20px}

/* ── SHIMMER AU HOVER (reflet verre) ── */
.glass-shimmer{position:relative;overflow:hidden}
.glass-shimmer::after{content:'';position:absolute;top:0;left:-160%;width:55%;height:100%;background:linear-gradient(115deg,transparent,rgba(255,255,255,0.16),transparent);transform:skewX(-18deg);transition:left 0.85s cubic-bezier(0.16,1,0.3,1);pointer-events:none;z-index:2}
.glass-shimmer:hover::after{left:160%}

/* ── RESPONSIVE MOBILE ── */
@media(max-width:768px){
  .brand-inner{grid-template-columns:1fr}
  .svc-row{grid-template-columns:1fr}
  .svc-row.rev .svc-img-col,.svc-row.rev .svc-txt-col{order:unset}
  .contact-grid{grid-template-columns:1fr;gap:52px}
  .ba-grid{grid-template-columns:1fr}
}
@media(max-width:640px){
  .hero-content{padding:0 22px 96px}
  .hero-line-inner{font-size:clamp(34px,10vw,52px)}
  .hero-logo-wrap{margin-bottom:24px}
  .hero-btns{gap:10px}
  .brand-txt-col{padding:44px 22px}
  .brand-h{font-size:48px}
  .svc-txt-col{padding:36px 22px}
  .svc-num{font-size:52px}
  .svc-header{padding:64px 22px 52px}
  .gallery-sec{padding:64px 0}
  .gallery-header{padding:0 22px 36px}
  .gallery-track{padding:0 22px;gap:12px}
  .gallery-card{flex:0 0 200px}
  .ba-sec{padding:64px 22px}
  .ba-h{margin-bottom:40px}
  .book-sec{padding:80px 22px}
  .book-h{font-size:clamp(44px,12vw,64px)}
  .contact-sec{padding:64px 22px}
  .contact-h{font-size:38px}
  .footer{padding:40px 22px 32px}
  .toggles-right{bottom:16px;right:12px;gap:6px}
  .island{bottom:12px;max-width:calc(100vw - 130px);padding:6px 12px}
  .island a{font-size:9px;padding:5px 8px}
  .wa-fab{bottom:68px;right:12px;width:44px;height:44px}
  .modal{padding:24px 18px 44px}
}`

// ── BA Slider ────────────────────────────────────────────────
// ── Mokary-style line-mask title reveal ──────────────────────
function RevealLines({ text, className, style, tag = 'h2', baseDelay = 0 }:
  { text: string; className?: string; style?: React.CSSProperties; tag?: 'h1'|'h2'|'h3'|'p'; baseDelay?: number }) {
  const lines = text.split('\n')
  const Tag = tag as React.ElementType
  return (
    <Tag className={className} style={style}>
      {lines.map((line, i) => (
        <span className="line-mask rv" key={i} style={{ transitionDelay: `${baseDelay + i * 0.1}s` }}>
          <span className="line-mask-inner">{line}</span>
        </span>
      ))}
    </Tag>
  )
}

// ── Numéro de section style Mokary ("01", "02"...) ────────────
function SecNum({ n }: { n: string }) {
  return <span className="sec-num">{n}</span>
}

// ── BA Slider ────────────────────────────────────────────────
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
    <div className="ba-slider glass-shimmer" ref={ref}
      onMouseDown={e => { drag.current = true; move(e.clientX) }}
      onTouchStart={e => { drag.current = true; move(e.touches[0].clientX) }}>
      <img className="ba-img" src={before} alt="avant" />
      <div className="ba-after" style={{ clipPath:`inset(0 ${100-pos}% 0 0)` }}><img src={after} alt="après" /></div>
      <div className="ba-line" style={{ left:`${pos}%` }}><div className="ba-handle">⟺</div></div>
    </div>
  )
}

// ── Gallery Horizontal Scroll ────────────────────────────────
function GalleryScroll({ items }: { items: typeof GALLERY_ITEMS }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const drag = useRef(false)
  const startX = useRef(0)
  const scrollStart = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = true
    startX.current = e.clientX
    scrollStart.current = trackRef.current?.scrollLeft || 0
    trackRef.current?.classList.add('dragging')
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current || !trackRef.current) return
    trackRef.current.scrollLeft = scrollStart.current - (e.clientX - startX.current)
  }
  const onMouseUp = () => {
    drag.current = false
    trackRef.current?.classList.remove('dragging')
  }
  const onScroll = () => {
    if (!trackRef.current) return
    const idx = Math.round(trackRef.current.scrollLeft / 276)
    setActive(Math.min(idx, items.length - 1))
  }
  const scrollTo = (i: number) => {
    trackRef.current?.scrollTo({ left: i * 276, behavior: 'smooth' })
    setActive(i)
  }

  return (
    <div className="gallery-track-wrap">
      <div className="gallery-track" ref={trackRef}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onScroll={onScroll}>
        {items.map((item, i) => (
          <div key={i} className="gallery-card glass-shimmer">
            <img src={item.img} alt={item.name} draggable={false} style={{objectPosition: item.img.includes('gallery-makeup') ? 'center 60%' : 'top'}} />
            <div className="gallery-card-over">
              <div className="gallery-card-tag">{item.label}</div>
              <div className="gallery-card-name">{item.name}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="gallery-dots">
        {items.map((_, i) => <div key={i} className={`gallery-dot${active===i?' on':''}`} onClick={() => scrollTo(i)} />)}
      </div>
    </div>
  )
}

// ── Scroll Reveal ─────────────────────────────────────────────
function useActiveSection() {
  const [active, setActive] = useState('hero')
  useEffect(() => {
    const sections = ['hero','sourcils','levres','makeup','nails','gallery','contact']
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id || 'hero') }),
      { threshold: 0.3 }
    )
    sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return active
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('go'); obs.unobserve(e.target) } }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.rv,.rv-l,.rv-r,.clip-reveal,.zoom-reveal,.gold-line').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ── Booking Modal ─────────────────────────────────────────────
function BookingModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = T[lang]
  const [step, setStep]       = useState(0)
  const [selCat, setCat]      = useState<string|null>(null)
  const [selSvc, setSvc]      = useState<{name:string;devis:boolean}|null>(null)
  const [selDate, setDate]    = useState<string|null>(null)
  const [selSlot, setSlot]    = useState<string|null>(null)
  const [form, setForm]       = useState({prenom:'',nom:'',tel:'',dob:'',notes:''})
  const [health, setHealth]   = useState<boolean[]>(new Array(HEALTH_ITEMS.FR.length).fill(false))
  const [healthNotes, setHN]  = useState('')
  const [consent, setConsent] = useState(false)
  const [payMethod, setPay]   = useState<string|null>(null)
  const [errors, setErrors]   = useState<Record<string,boolean>>({})

  const hasCI = health.some(Boolean)
  const checkedItems = HEALTH_ITEMS[lang].filter((_,i) => health[i])

  const now = new Date()
  const [calYear, setCY] = useState(now.getFullYear())
  const [calMonth, setCM] = useState(now.getMonth())
  const todayStr = now.toISOString().split('T')[0]
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const offset = firstDay===0 ? 6 : firstDay-1
  const dim = new Date(calYear, calMonth+1, 0).getDate()
  const DAYS = ['L','M','M','J','V','S','D']
  const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

  const cats = [...new Set(SERVICES.map(s => s.cat))]
  const filteredSvcs = selCat ? SERVICES.filter(s => s.cat===selCat) : SERVICES

  const WA = '25377596159'

  function buildMsg() {
    let msg = `Bonjour ADORÉA ✨\n\n`
    msg += `━━ PRESTATION ━━\n${selSvc?.name}${selSvc?.devis ? '\n⚠️ Prestation sur devis — j\'attends votre estimation.' : ''}\n\n`
    msg += `━━ DATE SOUHAITÉE ━━\n${selDate} à ${selSlot}\n\n`
    msg += `━━ MES COORDONNÉES ━━\nPrénom : ${form.prenom}\nNom : ${form.nom}\nTéléphone : ${form.tel}\n${form.dob?`Date de naissance : ${form.dob}\n`:''}`
    if (form.notes) msg += `\n━━ INFORMATIONS COMPLÉMENTAIRES ━━\n${form.notes}\n`
    if (hasCI) {
      msg += `\n━━ INFORMATIONS SANTÉ ━━\n⚠️ Contre-indications signalées :\n`
      checkedItems.forEach(c => { msg += `• ${c}\n` })
      if (healthNotes) msg += `Précisions : ${healthNotes}\n`
    }
    msg += `\n✅ J'ai lu et j'accepte les conditions et instructions post-prestation ADORÉA.\n`
    if (payMethod) {
      msg += `\n━━ MODE DE PAIEMENT ━━\n${payMethod}\n`
      if (payMethod !== 'CASH') msg += `Je joins la capture de paiement.\n`
    }
    msg += `\nMerci ! 🙏`
    return msg
  }

  function validate(s: number) {
    const e: Record<string,boolean> = {}
    if (s===0 && !selSvc) return false
    if (s===1 && (!selDate||!selSlot)) return false
    if (s===2) {
      if (!form.prenom) e.prenom=true
      if (!form.nom) e.nom=true
      if (!form.tel) e.tel=true
      if (Object.keys(e).length) { setErrors(e); return false }
    }
    if (s===3 && hasCI && !healthNotes) { setErrors({hn:true}); return false }
    if (s===3 && !consent) { setErrors({consent:true}); return false }
    setErrors({})
    return true
  }

  function next() { if (validate(step)) setStep(s=>s+1) }

  function reserve() {
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(buildMsg())}`, '_blank')
  }

  const PAY = [
    {key:'CAC PAY', desc:lang==='FR'?'Payez via CAC PAY et envoyez la capture par WhatsApp.':lang==='EN'?'Pay via CAC PAY and send the screenshot via WhatsApp.':'ادفع عبر CAC PAY وأرسل الإيصال.'},
    {key:'WAAFI',   desc:lang==='FR'?'Payez sur WAAFI et envoyez la capture par WhatsApp.':lang==='EN'?'Pay via WAAFI and send the receipt via WhatsApp.':'ادفع عبر WAAFI وأرسل الإيصال.'},
    {key:'D-MONEY', desc:lang==='FR'?'Payez via D-Money et envoyez la capture par WhatsApp.':lang==='EN'?'Pay via D-Money and send the receipt via WhatsApp.':'ادفع عبر D-Money وأرسل الإيصال.'},
    {key:'CASH',    desc:lang==='FR'?'Paiement en espèces réservé aux clientes ayant déjà effectué au moins une prestation chez ADORÉA.':lang==='EN'?'Cash only for returning clients with at least one previous appointment.':'الدفع نقداً للعميلات اللواتي لديهن موعد سابق.'},
  ]

  const canNext = [!!selSvc, !!(selDate&&selSlot), true, true, !!payMethod][step]

  return (
    <div className="modal-back" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        {/* Croix fermeture */}
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="steps-bar">{t.book_step.map((_,i) => <div key={i} className={`step-seg${i<=step?' done':''}`}/>)}</div>
        <h2 className="modal-h">{t.book_step[step]}</h2>
        <p className="modal-sub">ADORÉA · {t.cert}</p>

        {/* STEP 0 */}
        {step===0 && (
          <>
            <div className="cat-tabs">
              {cats.map(c => <button key={c} className={`cat-tab${selCat===c?' on':''}`} onClick={()=>{setCat(selCat===c?null:c);setSvc(null)}}>{c}</button>)}
            </div>
            <div className="pick-list">
              {filteredSvcs.flatMap(s => s.items.map(item => (
                <button key={item.name} className={`pick-item${selSvc?.name===item.name?' on':''}`} onClick={()=>setSvc(item)}>
                  <div className="rdot"/>
                  <div>
                    <span className="pick-name">{item.name}</span>
                    {item.devis && <span className="pick-devis-badge">· Sur devis</span>}
                    <div className="pick-cat">{s.label[lang]}</div>
                  </div>
                </button>
              )))}
            </div>
          </>
        )}

        {/* STEP 1 */}
        {step===1 && (
          <>
            <div className="cal-hdr">
              <button className="cal-nav" onClick={()=>{ if(calMonth===0){setCM(11);setCY(y=>y-1)}else setCM(m=>m-1) }}>‹</button>
              <span className="cal-ml">{new Date(calYear,calMonth,1).toLocaleDateString(lang==='AR'?'ar':lang==='EN'?'en-US':'fr-FR',{month:'long',year:'numeric'})}</span>
              <button className="cal-nav" onClick={()=>{ if(calMonth===11){setCM(0);setCY(y=>y+1)}else setCM(m=>m+1) }}>›</button>
            </div>
            <div className="cal-dow">{DAYS.map((d,i)=><div key={i} className="cal-dl">{d}</div>)}</div>
            <div className="cal-grid">
              {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:dim},(_,i)=>{
                const d=i+1
                const str=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                return <button key={d} className={`cal-d${str>=todayStr?' av':''}${selDate===str?' sel':''}`} onClick={()=>str>=todayStr&&setDate(str)} disabled={str<todayStr}>{d}</button>
              })}
            </div>
            {selDate && <>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.18em',color:C.taupe,textTransform:'uppercase',marginBottom:10}}>
                {lang==='FR'?'Créneaux disponibles':lang==='EN'?'Available slots':'الأوقات المتاحة'}
              </div>
              <div className="slots-g">{SLOTS.map(s=><button key={s} className={`slot${selSlot===s?' on':''}`} onClick={()=>setSlot(s)}>{s}</button>)}</div>
            </>}
            <div className="cal-note">{lang==='FR'?'* Créneaux indicatifs. Votre experte confirme le créneau définitif sous 24h.':lang==='EN'?'* Indicative slots. Your expert confirms within 24h.':'* مواعيد استرشادية. تؤكد خبيرتك خلال 24 ساعة.'}</div>
          </>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label className="f-lbl">{lang==='AR'?'الاسم':lang==='EN'?'First name':'Prénom *'}</label><input className={`f-in${errors.prenom?' err':''}`} value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))}/></div>
              <div><label className="f-lbl">{lang==='AR'?'اللقب':lang==='EN'?'Last name':'Nom *'}</label><input className={`f-in${errors.nom?' err':''}`} value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/></div>
            </div>
            <label className="f-lbl">{lang==='AR'?'الهاتف':lang==='EN'?'Phone *':'Téléphone *'}</label>
            <input className={`f-in${errors.tel?' err':''}`} type="tel" placeholder="+253..." value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))}/>
            <label className="f-lbl">{lang==='AR'?'تاريخ الميلاد':lang==='EN'?'Date of birth':'Date de naissance'}</label>
            <input className="f-in" type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/>
            <label className="f-lbl">{lang==='AR'?'ملاحظات':lang==='EN'?'Notes':'Notes / Informations complémentaires'}</label>
            <textarea className="f-ta" placeholder={lang==='FR'?'Demandes spéciales, informations utiles...':lang==='EN'?'Special requests...':'معلومات إضافية...'} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
          </>
        )}

        {/* STEP 3 — Santé + Consentement */}
        {step===3 && (
          <>
            <p style={{fontSize:12,fontWeight:300,color:C.taupe,lineHeight:1.7,marginBottom:16,fontFamily:'Montserrat,sans-serif'}}>
              {lang==='FR'?'Indiquez si vous êtes concernée par l\'une des situations suivantes :':lang==='EN'?'Please indicate if any of the following apply :':'يرجى الإشارة إلى ما ينطبق عليكِ :'}
            </p>
            <div className="h-list">
              {HEALTH_ITEMS[lang].map((item,i)=>(
                <label key={i} className="h-item">
                  <input type="checkbox" className="h-chk" checked={health[i]} onChange={e=>setHealth(h=>h.map((v,j)=>j===i?e.target.checked:v))}/>
                  <span className="h-lbl">{item}</span>
                </label>
              ))}
            </div>

            {hasCI && (
              <div className="ci-box">
                <div className="ci-box-h">⚠️ {lang==='FR'?'Contre-indications signalées':lang==='EN'?'Reported contra-indications':'موانع مُشار إليها'}</div>
                <div className="ci-box-p">
                  {lang==='FR'?'Vous avez indiqué :':lang==='EN'?'You indicated:':'أشرتِ إلى :'}
                  <ul className="ci-items">{checkedItems.map((c,i)=><li key={i}>{c}</li>)}</ul>
                </div>
                <div style={{marginTop:12}}>
                  <label className="f-lbl" style={{color:errors.hn?'#E88':undefined}}>
                    {lang==='FR'?'Précisez vos contre-indications *':lang==='EN'?'Describe your contra-indications *':'وصف تفصيلي *'}
                  </label>
                  <textarea className={`f-ta${errors.hn?' err':''}`} placeholder={lang==='FR'?'Décrivez en détail...':lang==='EN'?'Describe in detail...':'وصف تفصيلي...'} value={healthNotes} onChange={e=>setHN(e.target.value)}/>
                </div>
              </div>
            )}

            {/* Consentement */}
            <div className="consent-box">
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:C.orFonce,textTransform:'uppercase',marginBottom:12,fontFamily:'Montserrat,sans-serif'}}>
                {t.consent_title}
              </div>
              <div className="consent-text">{t.consent_text}</div>
              <label className={`consent-check-wrap${consent?' checked':''}`}>
                <input type="checkbox" className="consent-chk" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
                <span className="consent-lbl">{t.consent_check}</span>
              </label>
              {errors.consent && <div style={{fontSize:11,color:'#E44',marginTop:8,fontFamily:'Montserrat,sans-serif'}}>{lang==='FR'?'Veuillez accepter les conditions pour continuer.':lang==='EN'?'Please accept the conditions to continue.':'يجب الموافقة على الشروط للمتابعة.'}</div>}
            </div>

            {/* Message confirmation ou CI */}
            {consent && (
              <div className={`confirm-banner${hasCI?' confirm-ci':' confirm-ok'}`}>
                {hasCI ? t.ci_msg : t.confirmed_msg}
              </div>
            )}
          </>
        )}

        {/* STEP 4 */}
        {step===4 && (
          <>
            <div className="recap-box">
              {[
                {l:lang==='FR'?'Soin':lang==='EN'?'Service':'الخدمة',v:selSvc?.name},
                {l:'Date',v:selDate?`${selDate} · ${selSlot}`:'—'},
                {l:lang==='FR'?'Cliente':lang==='EN'?'Client':'العميلة',v:`${form.prenom} ${form.nom}`},
              ].map(r=><div key={r.l} className="recap-row"><span style={{color:C.taupe}}>{r.l}</span><span style={{color:C.noir}}>{r.v}</span></div>)}
            </div>

            {selSvc?.devis && (
              <div style={{background:'#FBF5EE',border:`1px solid ${C.or}`,borderRadius:12,padding:'11px 14px',marginBottom:14,fontSize:12,color:C.taupe,fontFamily:'Montserrat,sans-serif',fontWeight:300,lineHeight:1.6}}>
                ℹ️ {lang==='FR'?'Cette prestation est sur devis. Votre experte vous communiquera le tarif lors de la confirmation.':'This service is priced on request. Your expert will share the price upon confirmation.'}
              </div>
            )}

            <p style={{fontSize:11,fontWeight:300,color:C.taupe,lineHeight:1.7,marginBottom:14,fontFamily:'Montserrat,sans-serif'}}>
              {lang==='FR'?'Sélectionnez votre mode de paiement puis cliquez sur "Réserver via WhatsApp".':lang==='EN'?'Select your payment method then click "Book via WhatsApp".':'اختاري طريقة الدفع ثم اضغطي على "احجزي عبر واتساب".'}
            </p>

            <div className="pay-list">
              {PAY.map(opt=>(
                <button key={opt.key} className={`pay-opt${payMethod===opt.key?' on':''}`} onClick={()=>setPay(opt.key)}>
                  <div className="rdot" style={payMethod===opt.key?{background:C.or,borderColor:C.or}:{}}/>
                  <div><div className="pay-name">{opt.key}</div><div className="pay-desc">{opt.desc}</div></div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="modal-foot">
          {step>0 && <button className="btn-prev-m" onClick={()=>setStep(s=>s-1)}>{t.prev}</button>}
          {step<4 && <button className="btn-or" style={{flex:1,opacity:canNext?1:0.25,cursor:canNext?'pointer':'not-allowed'}} onClick={next} disabled={!canNext}>{t.next}</button>}
          {step===4 && <button className="btn-or" style={{flex:1,opacity:payMethod?1:0.25,cursor:payMethod?'pointer':'not-allowed'}} onClick={reserve} disabled={!payMethod}>
            {lang==='FR'?'Réserver via WhatsApp 💬':lang==='EN'?'Book via WhatsApp 💬':'احجزي عبر واتساب 💬'}
          </button>}
        </div>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang]       = useState<Lang>('FR')
  const [waOn, setWaOn]       = useState(true)
  const [langOpen, setLangOpen] = useState(false)
  const [booking, setBooking] = useState(false)
  const activeSection          = useActiveSection()
  const t = T[lang]
  const dir = lang==='AR' ? 'rtl' : 'ltr'
  useReveal()

  const SOCIAL = [
    {name:'Instagram',icon:'📷',url:'https://www.instagram.com/adorea.dj?utm_source=qr&stkn=dzFvMGlsd2djeTgx'},
    {name:'Facebook', icon:'👍',url:'https://www.facebook.com/share/1FeC3VJB82/'},
    {name:'TikTok',   icon:'🎵',url:'https://www.tiktok.com/@adorea.dj?_r=1&_t=ZS-99ct94BI1J9'},
    {name:'Snapchat', icon:'👻',url:'https://www.snapchat.com/add/adorea.dj?share_id=ojG8RTvtwYI&locale=fr-BE'},
  ]

  return (
    <div dir={dir}>
      <style>{CSS}</style>

      {/* ── TOGGLES DROITE ── */}
      <div className="toggles-right">
        {/* Langue dropdown */}
        <div style={{position:'relative'}}>
          <button className={`lang-btn${langOpen?' open':''}`} onClick={()=>setLangOpen(o=>!o)}>
            {lang}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className={`lang-dropdown${langOpen?' open':''}`}>
            {(['FR','EN','AR'] as Lang[]).map(l => (
              <button key={l} className={lang===l?'on':''} onClick={()=>{setLang(l);setLangOpen(false)}}>{l === 'FR' ? '🇫🇷 FR' : l === 'EN' ? '🇬🇧 EN' : '🇸🇦 AR'}</button>
            ))}
          </div>
        </div>

      </div>

      {/* ── ISLAND NAV ── */}
      <nav className={`island ${["brand","ba"].includes(activeSection) ? "light" : "dark"}`}>
        {t.nav.map((item,i) => <a key={i} href={['#hero','#rdv','#sourcils','#levres','#makeup','#nails','#contact'][i]}>{item}</a>)}
      </nav>

      {/* ── WA FAB ── */}
      <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className={`wa-fab${waOn?'':' off'}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* ══ HERO ══ */}
      <section className="hero" id="hero">
        <div className="hero-bg"><img src="/images/hero-main.png" alt="ADORÉA"/></div>
        <div className="hero-grad"/>
        <div className="hero-content">
          <div className="hero-logo-wrap">
            <div className="glass-chip" style={{display:'flex',alignItems:'center',gap:14,padding:'10px 20px 10px 10px'}}>
              <img src="/images/logo-mark.png" alt="ADORÉA logo" style={{width:56,height:56,objectFit:'contain'}}/>
              <div style={{lineHeight:1}}>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:300,color:C.blanc,letterSpacing:'0.22em',textTransform:'uppercase'}}>ADORÉA</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontSize:8,fontWeight:300,color:C.blanc,letterSpacing:'0.22em',textTransform:'uppercase',marginTop:4,opacity:0.6}}>PMU & MAKEUP PRO</div>
              </div>
            </div>
          </div>
          <div className="hero-tag">{t.tagline}</div>
          <div className="gold-line rv" style={{width:80,marginBottom:24}}/>
          <h1 className="hero-h1">
            <span className="hero-line"><span className="hero-line-inner">{t.h1a}</span></span>
            <span className="hero-line"><span className="hero-line-inner">{t.h1b}</span></span>
          </h1>
          <div className="hero-btns">
            <button className="btn-or" onClick={()=>setBooking(true)}>{t.cta1}</button>
            <a href="#sourcils" className="btn-outline">{t.cta2}</a>
          </div>
        </div>
      </section>

      {/* ══ BRAND ══ */}
      <section className="brand-sec">
        <div className="brand-inner">
          <div className="brand-img-col rv-l glass-shimmer">
            <img src="/images/brand-beige.png" alt="ADORÉA Brand" style={{objectPosition:'center 30%'}}/>
          </div>
          <div className="brand-txt-col">
            <div className="tag rv na" style={{color:C.orFonce}}><SecNum n="01"/>{t.brand_tag}</div>
            <RevealLines tag="h2" text={t.brand_h} className="brand-h" style={{transitionDelay:'0.1s'} as React.CSSProperties} baseDelay={0.1}/>
            <p className="brand-p rv" style={{transitionDelay:'0.2s'}}>
              {lang==='FR'?'ADORÉA est un studio beauté premium à Djibouti. Spécialisé dans le maquillage permanent, le makeup professionnel et l\'art des ongles — chaque prestation est réalisée avec des pigments certifiés et des techniques maîtrisées en Belgique.':
               lang==='EN'?'ADORÉA is a premium beauty studio in Djibouti. Specialising in permanent makeup, professional beauty and nail artistry — every treatment uses certified pigments and Belgian-certified techniques.':
               'أدوريا استوديو تجميل فاخر في جيبوتي. كل خدمة تُنفَّذ بأصباغ معتمدة وتقنيات بلجيكية.'}
            </p>
            <div className="brand-kws rv" style={{transitionDelay:'0.3s'}}>
              {t.brand_kw.map((k,i)=><div key={i} className="brand-kw-item">{k}</div>)}
            </div>
            <div className="rv glass-chip-light" style={{transitionDelay:'0.4s',display:'inline-flex',alignItems:'center',gap:12,padding:'12px 18px'}}>
              <img src="/images/logo-mark.png" alt="" style={{width:24,height:24,objectFit:'contain'}}/>
              <span style={{fontFamily:'Montserrat,sans-serif',fontSize:9,fontWeight:500,letterSpacing:'0.2em',color:C.taupe,textTransform:'uppercase'}}>{t.cert}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="fade-sep"/>

      {/* ══ SERVICES ══ */}
      <section className="svc-sec" id="services">
        <div className="svc-header">
          <div className="tag rv" style={{justifyContent:'center'}}><SecNum n="02"/>{t.svc_tag}</div>
          <RevealLines tag="h2" text={t.svc_sub} className="svc-header-h" style={{transitionDelay:'0.1s'} as React.CSSProperties} baseDelay={0.1}/>
        </div>

        {SERVICES.map((s,idx)=>(
          <div key={s.id} id={s.id}>
            <div className={`svc-row${idx%2===1?' rev':''}`} style={{background:s.bg}}>
              <div className="svc-img-col rv parallax-wrap glass-shimmer"><img src={s.img} alt={s.label[lang]}/></div>
              <div className="svc-txt-col" style={{background:s.bg}}>
                <div className="svc-num rv">{String(idx+1).padStart(2,'0')}</div>
                <div className="svc-cat-lbl rv" style={{transitionDelay:'0.05s'}}>{s.cat}</div>
                <h3 className="svc-title rv" style={{transitionDelay:'0.1s'}}>{s.label[lang]}</h3>
                <div className="svc-kwtxt rv" style={{transitionDelay:'0.15s'}}>{s.kw}</div>
                <p className="svc-desc rv" style={{transitionDelay:'0.2s'}}>{s.desc[lang]}</p>
                <div className="svc-list rv" style={{transitionDelay:'0.25s'}}>
                  {s.items.map((item,j)=>(
                    <div key={j} className="svc-list-item">
                      {item.name}
                      {item.devis && <span className="svc-devis">· Sur devis</span>}
                    </div>
                  ))}
                </div>
                <div className="rv" style={{transitionDelay:'0.3s'}}>
                  <button className="btn-or" onClick={()=>setBooking(true)}>{lang==='AR'?'احجزي':lang==='EN'?'Book':'Réserver'}</button>
                </div>
              </div>
            </div>
            {idx < SERVICES.length-1 && <div className="svc-sep"/>}
          </div>
        ))}
      </section>

      <div className="fade-sep"/>

      {/* ══ GALLERY HORIZONTALE ══ */}
      <section className="gallery-sec" id="gallery">
        <div className="gallery-header">
          <div className="tag rv" style={{justifyContent:'center'}}><SecNum n="03"/>{t.gallery_tag}</div>
        </div>
        <GalleryScroll items={GALLERY_ITEMS} />
      </section>

      <div className="fade-sep"/>

      {/* ══ BEFORE / AFTER ══ */}
      <section className="ba-sec">
        <div className="tag rv" style={{color:C.orFonce}}><SecNum n="04"/>{t.ba_tag}</div>
        <RevealLines tag="h2" text={t.ba_h} className="ba-h" style={{transitionDelay:'0.1s'} as React.CSSProperties} baseDelay={0.1}/>
        <div className="ba-grid">
          {BA.map((item,i)=>(
            <div key={i} className="rv" style={{transitionDelay:`${i*0.15}s`}}>
              <div className="ba-lbl">{item.label}</div>
              <BASlider before={item.before} after={item.after}/>
              <div className="ba-ends"><span className="ba-end">{t.bef}</span><span className="ba-end">{t.aft}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BOOK CTA ══ */}
      <section className="book-sec" id="rdv">
        <div className="tag rv" style={{justifyContent:'center'}}><SecNum n="05"/>{t.book_tag}</div>
        <RevealLines tag="h2" text={t.book_h} className="book-h" style={{transitionDelay:'0.1s'} as React.CSSProperties} baseDelay={0.1}/>
        <p className="book-sub rv" style={{transitionDelay:'0.2s'}}>{t.book_sub}</p>
        <div className="rv" style={{transitionDelay:'0.3s'}}>
          <button className="btn-or" onClick={()=>setBooking(true)}>{t.book_btn}</button>
        </div>
      </section>

      <div className="fade-sep"/>

      {/* ══ CONTACT ══ */}
      <section className="contact-sec" id="contact">
        <div className="contact-grid">
          <div>
            <div className="tag rv" style={{color:C.or}}><SecNum n="06"/>{t.contact_tag}</div>
            <h2 className="contact-h rv" style={{transitionDelay:'0.1s'}}>ADORÉA</h2>
            <div className="contact-sub rv" style={{transitionDelay:'0.15s'}}>PMU & MAKEUP PRO · CERTIFIED BELGIUM</div>
            {[
              {l:lang==='AR'?'العنوان':lang==='EN'?'Address':'Adresse',v:'PK13 – Bâtiment B1-2\nDjibouti Ville'},
              {l:lang==='AR'?'الهاتف':lang==='EN'?'Phone':'Téléphone',v:'+253 77 59 61 59'},
              {l:'Email',v:'adlina@adorea-dj.com'},
              {l:lang==='AR'?'أوقات العمل':lang==='EN'?'Hours':'Horaires',v:t.hours},
            ].map((item,i)=>(
              <div key={i} className={`ci-info rv`} style={{transitionDelay:`${0.2+i*0.07}s`}}>
                <div className="ci-lbl">{item.l}</div>
                <div className="ci-val" style={{whiteSpace:'pre-line'}}>{item.v}</div>
              </div>
            ))}
            <div className="contact-btns rv" style={{transitionDelay:'0.5s'}}>
              <a href="tel:+25377596159" className="btn-outline-d">{lang==='AR'?'اتصال':lang==='EN'?'Call':'Appeler'}</a>
              <a href="https://wa.me/25377596159" target="_blank" rel="noopener noreferrer" className="btn-or">WhatsApp</a>
            </div>
            <div className="social-row rv" style={{transitionDelay:'0.6s'}}>
              {SOCIAL.map(s=>(
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="soc-link glass-chip">
                  <span>{s.icon}</span>{s.name}
                </a>
              ))}
            </div>
          </div>
          <div className="rv-r">
            <div className="map-box glass-shimmer">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.5!2d43.0769420!3d11.5708051!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDM0JzE0LjkiTiA0M8KwMDQnMzcuMCJF!5e0!3m2!1sfr!2sdj!4v1"
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="ADORÉA Djibouti"/>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-top">
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <img src="/images/logo-mark.png" alt="ADORÉA" style={{width:46,height:46,objectFit:'contain'}}/>
            <div style={{lineHeight:1}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:300,color:C.blanc,letterSpacing:'0.22em',textTransform:'uppercase'}}>ADORÉA</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontSize:8,fontWeight:300,color:C.blanc,letterSpacing:'0.2em',textTransform:'uppercase',marginTop:3,opacity:0.5}}>PMU & MAKEUP PRO</div>
            </div>
          </div>
          <nav className="footer-links">
            {t.nav.map((item,i)=><a key={i} href={['#hero','#rdv','#sourcils','#levres','#makeup','#nails','#contact'][i]}>{item}</a>)}
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">{t.rights}</span>
          <div style={{display:'flex',gap:10}}>
            {SOCIAL.map(s=>(
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{width:32,height:32,borderRadius:'50%',border:'1px solid rgba(250,246,240,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,textDecoration:'none',transition:'all 0.2s',color:'rgba(250,246,240,0.3)'}}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {booking && <BookingModal lang={lang} onClose={()=>setBooking(false)}/>}
    </div>
  )
}
