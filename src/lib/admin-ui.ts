// Styles et helpers partagés par tout l'admin ADORÉA
export const T = {
  nude: '#D7B6B1', beige: '#EADCC8', gold: '#C9A96A', goldDark: '#9A7840',
  black: '#1A1A1A', offwhite: '#F9F6F2', muted: '#8A7A74',
  line: '#E6DDD2', soft: '#FBF6EF',
  green: '#3E8E5A', red: '#C94F4F', blue: '#4A6FA5',
}

export const FDJ = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FDJ'

export const ADMIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@300;400;500;600;700&display=swap');

.adm *{box-sizing:border-box}
.adm{font-family:'Manrope',sans-serif;color:${T.black}}

/* ══ BOUTONS AVEC FEEDBACK ══ */
.btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:none;cursor:pointer;font-family:'Manrope',sans-serif;font-weight:600;
  border-radius:100px;padding:11px 22px;font-size:12.5px;letter-spacing:0.02em;
  transition:transform .12s cubic-bezier(.34,1.56,.64,1),box-shadow .2s,background .2s,opacity .2s;
  overflow:hidden;-webkit-tap-highlight-color:transparent;user-select:none}
.btn:active{transform:scale(.955)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important}
.btn::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--x,50%) var(--y,50%),rgba(255,255,255,.45) 0%,transparent 55%);opacity:0;transition:opacity .45s}
.btn:active::after{opacity:1;transition:opacity 0s}

.btn-dark{background:${T.black};color:${T.offwhite};box-shadow:0 2px 10px rgba(26,26,26,.18)}
.btn-dark:hover:not(:disabled){background:#2C2620;box-shadow:0 6px 20px rgba(26,26,26,.3)}
.btn-gold{background:${T.gold};color:${T.black};box-shadow:0 2px 10px rgba(201,169,106,.28)}
.btn-gold:hover:not(:disabled){background:#D8BA7E;box-shadow:0 6px 22px rgba(201,169,106,.42)}
.btn-ghost{background:transparent;color:${T.muted};border:1.5px solid ${T.line}}
.btn-ghost:hover:not(:disabled){border-color:${T.nude};color:${T.black};background:${T.soft}}
.btn-danger{background:transparent;color:${T.red};border:1.5px solid rgba(201,79,79,.3)}
.btn-danger:hover:not(:disabled){background:${T.red};color:#fff;border-color:${T.red}}
.btn-sm{padding:8px 15px;font-size:11.5px}
.btn-lg{padding:15px 30px;font-size:13.5px}
.btn-block{width:100%}

/* Icone ronde */
.ibtn{width:34px;height:34px;border-radius:50%;border:1.5px solid ${T.line};background:#fff;
  cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:14px;
  color:${T.muted};transition:all .18s;flex-shrink:0}
.ibtn:hover{border-color:${T.nude};color:${T.black};background:${T.soft};transform:translateY(-1px)}
.ibtn:active{transform:scale(.92)}
.ibtn.danger:hover{border-color:${T.red};color:${T.red};background:#FFF0F0}

/* ══ CARTES / TUILES CLIQUABLES ══ */
.tile{background:#fff;border:1.5px solid ${T.line};border-radius:16px;padding:14px;cursor:pointer;
  transition:transform .14s cubic-bezier(.34,1.56,.64,1),border-color .18s,box-shadow .18s,background .18s;
  text-align:left;font-family:'Manrope',sans-serif;-webkit-tap-highlight-color:transparent}
.tile:hover{border-color:${T.nude};background:${T.soft};box-shadow:0 4px 16px rgba(26,26,26,.07);transform:translateY(-2px)}
.tile:active{transform:scale(.98)}
.tile.on{border-color:${T.gold};background:#FBF5EA;box-shadow:0 0 0 3px rgba(201,169,106,.14)}

/* ══ CHIPS / ONGLETS ══ */
.chip{padding:8px 16px;border-radius:100px;border:1.5px solid ${T.line};background:#fff;cursor:pointer;
  font-family:'Manrope',sans-serif;font-size:11.5px;font-weight:600;color:${T.muted};
  transition:all .18s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.chip:hover{border-color:${T.nude};color:${T.black}}
.chip:active{transform:scale(.95)}
.chip.on{background:${T.black};border-color:${T.black};color:${T.offwhite}}
.chip-row{display:flex;gap:7px;flex-wrap:wrap}
.chip-scroll{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.chip-scroll::-webkit-scrollbar{display:none}
.chip-scroll .chip{flex-shrink:0}

/* ══ FORMULAIRES ══ */
.fl{font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${T.muted};
  margin-bottom:6px;display:block}
.fi{width:100%;padding:11px 14px;border:1.5px solid ${T.line};border-radius:13px;
  font-family:'Manrope',sans-serif;font-size:13px;background:#fff;color:${T.black};
  outline:none;transition:border-color .18s,box-shadow .18s}
.fi:focus{border-color:${T.nude};box-shadow:0 0 0 3px rgba(215,182,177,.16)}
.fi:disabled{background:#F4F0EA;color:${T.muted}}
textarea.fi{resize:vertical;min-height:76px;line-height:1.6}
.fg{margin-bottom:13px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:11px}

/* ══ TABLEAUX / LIGNES ══ */
.row{display:flex;align-items:center;gap:12px;padding:13px 16px;background:#fff;
  border:1.5px solid ${T.line};border-radius:15px;transition:border-color .18s,box-shadow .18s}
.row:hover{border-color:${T.nude};box-shadow:0 3px 12px rgba(26,26,26,.06)}
.row-list{display:flex;flex-direction:column;gap:7px}

/* ══ EN-TÊTE DE PAGE ══ */
.ph{display:flex;justify-content:space-between;align-items:center;gap:14px;
  margin-bottom:22px;flex-wrap:wrap}
.ph-t{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:300;line-height:1.1}
.ph-s{font-size:11.5px;color:${T.muted};margin-top:3px}
.pad{padding:26px}

/* ══ STATS ══ */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:11px;margin-bottom:20px}
.stat{background:#fff;border:1.5px solid ${T.line};border-radius:16px;padding:15px 17px;
  transition:transform .16s,box-shadow .18s}
.stat:hover{transform:translateY(-2px);box-shadow:0 5px 18px rgba(26,26,26,.07)}
.stat-l{font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${T.muted}}
.stat-v{font-family:'Cormorant Garamond',serif;font-size:27px;font-weight:400;margin-top:5px;line-height:1}

/* ══ BADGES ══ */
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:100px;
  font-size:10.5px;font-weight:700;letter-spacing:.03em;white-space:nowrap}
.badge-green{background:#E8F5EC;color:${T.green}}
.badge-gold{background:#FBF2E2;color:${T.goldDark}}
.badge-red{background:#FDEEEE;color:${T.red}}
.badge-grey{background:#F1EDE7;color:${T.muted}}
.badge-blue{background:#EAF0F8;color:${T.blue}}

/* ══ MODALE ══ */
.mo{position:fixed;inset:0;background:rgba(26,20,16,.62);backdrop-filter:blur(7px);z-index:600;
  display:flex;align-items:flex-end;justify-content:center;animation:moIn .22s ease}
@media(min-width:721px){.mo{align-items:center;padding:22px}}
@keyframes moIn{from{opacity:0}to{opacity:1}}
.mo-box{background:${T.offwhite};width:100%;max-width:520px;max-height:92svh;overflow-y:auto;
  border-radius:26px 26px 0 0;padding:26px 22px 34px;position:relative;
  animation:moUp .33s cubic-bezier(.19,1,.22,1)}
@media(min-width:721px){.mo-box{border-radius:24px;padding:28px}}
@keyframes moUp{from{transform:translateY(26px);opacity:0}to{transform:none;opacity:1}}
.mo-box.wide{max-width:760px}
.mo-x{position:absolute;top:15px;right:16px;width:31px;height:31px;border-radius:50%;
  background:#EFE8DE;border:none;cursor:pointer;font-size:16px;color:${T.muted};
  display:flex;align-items:center;justify-content:center;transition:all .18s;z-index:2}
.mo-x:hover{background:#E2D7C8;color:${T.black};transform:rotate(90deg)}
.mo-t{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;margin-bottom:3px;padding-right:34px}
.mo-s{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${T.muted};margin-bottom:20px}

/* ══ ÉTAT VIDE ══ */
.empty{text-align:center;padding:46px 20px;color:${T.muted}}
.empty-i{font-size:30px;opacity:.3;margin-bottom:10px}
.empty-t{font-size:13px;font-weight:600;margin-bottom:5px;color:${T.black}}
.empty-s{font-size:11.5px;line-height:1.6}

/* ══ TOAST ══ */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:900;
  background:${T.black};color:${T.offwhite};padding:12px 22px;border-radius:100px;
  font-size:12.5px;font-weight:500;box-shadow:0 8px 28px rgba(0,0,0,.32);
  animation:toastIn .3s cubic-bezier(.19,1,.22,1);display:flex;align-items:center;gap:9px;max-width:90vw}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.toast.ok{background:${T.green}}
.toast.err{background:${T.red}}

/* ══ SWITCH ══ */
.sw{width:38px;height:21px;border-radius:11px;background:${T.line};cursor:pointer;
  position:relative;transition:background .25s;flex-shrink:0;border:none;padding:0}
.sw.on{background:${T.gold}}
.sw::after{content:'';position:absolute;top:3px;left:3px;width:15px;height:15px;border-radius:50%;
  background:#fff;transition:transform .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 3px rgba(0,0,0,.2)}
.sw.on::after{transform:translateX(17px)}

/* ══ SKELETON ══ */
.sk{background:linear-gradient(90deg,#F0EBE4 25%,#F8F4EE 50%,#F0EBE4 75%);
  background-size:200% 100%;animation:skl 1.4s infinite;border-radius:12px}
@keyframes skl{from{background-position:200% 0}to{background-position:-200% 0}}

/* ══ RESPONSIVE ══ */
@media(max-width:720px){
  .pad{padding:15px}
  .ph{margin-bottom:16px}
  .ph-t{font-size:24px}
  .stats{grid-template-columns:repeat(2,1fr);gap:8px}
  .stat{padding:12px 13px}
  .stat-v{font-size:21px}
  .stat-l{font-size:8.5px;letter-spacing:.12em}
  .frow{grid-template-columns:1fr}
  .row{flex-wrap:wrap;padding:12px 13px;gap:9px}
  .btn{padding:11px 18px;font-size:12px}
  .btn-block-m{width:100%}
  .hide-m{display:none!important}
  .scroll-x{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:0 -15px;padding:0 15px}
  .scroll-x::-webkit-scrollbar{display:none}
}
@media(min-width:721px){.only-m{display:none!important}}
`

// Ripple : positionne le dégradé au point cliqué
export function ripple(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`)
  el.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`)
}
