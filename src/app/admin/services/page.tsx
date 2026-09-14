'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Service, Category } from '@/types'

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

type SvcForm = {
  id?: string
  category_id: string
  nom_fr: string
  desc_fr: string
  prix: string
  prix_sur_devis: boolean
  duree_minutes: string
  is_pmu: boolean
  actif: boolean
}
const EMPTY_SVC: SvcForm = {
  category_id:'', nom_fr:'', desc_fr:'', prix:'', prix_sur_devis:false,
  duree_minutes:'60', is_pmu:false, actif:true,
}

type CatForm = { id?: string; nom_fr: string; desc_fr: string; actif: boolean }
const EMPTY_CAT: CatForm = { nom_fr:'', desc_fr:'', actif:true }

export default function ServicesPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'services'|'categories'>('services')
  const [cats, setCats] = useState<Category[]>([])
  const [svcs, setSvcs] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('')

  const [svcOpen, setSvcOpen] = useState(false)
  const [svcForm, setSvcForm] = useState<SvcForm>(EMPTY_SVC)
  const [catOpen, setCatOpen] = useState(false)
  const [catForm, setCatForm] = useState<CatForm>(EMPTY_CAT)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [c, s] = await Promise.all([
      supabase.from('categories').select('*').order('ordre'),
      supabase.from('services').select('*').order('ordre'),
    ])
    setCats((c.data as Category[]) || [])
    setSvcs((s.data as Service[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // ── Services ──
  function newSvc() {
    setSvcForm({ ...EMPTY_SVC, category_id: filterCat || cats[0]?.id || '' })
    setSvcOpen(true)
  }
  function editSvc(s: Service) {
    setSvcForm({
      id: s.id, category_id: s.category_id, nom_fr: s.nom_fr,
      desc_fr: s.desc_fr || '', prix: String(s.prix || ''),
      prix_sur_devis: s.prix_sur_devis, duree_minutes: String(s.duree_minutes || 60),
      is_pmu: s.is_pmu, actif: s.actif,
    })
    setSvcOpen(true)
  }
  async function saveSvc() {
    if (!svcForm.nom_fr || !svcForm.category_id) return
    setSaving(true)
    const payload = {
      category_id: svcForm.category_id,
      slug: slugify(svcForm.nom_fr),
      nom_fr: svcForm.nom_fr,
      desc_fr: svcForm.desc_fr || null,
      prix: svcForm.prix_sur_devis ? 0 : Number(svcForm.prix || 0),
      prix_sur_devis: svcForm.prix_sur_devis,
      duree_minutes: Number(svcForm.duree_minutes || 60),
      is_pmu: svcForm.is_pmu,
      actif: svcForm.actif,
    }
    if (svcForm.id) await supabase.from('services').update(payload).eq('id', svcForm.id)
    else await supabase.from('services').insert({ ...payload, ordre: svcs.length + 1 })
    setSaving(false); setSvcOpen(false); load()
  }
  async function delSvc(id: string) {
    if (!confirm('Supprimer cette prestation ?')) return
    await supabase.from('services').delete().eq('id', id); load()
  }
  async function toggleSvc(id: string, actif: boolean) {
    await supabase.from('services').update({ actif }).eq('id', id); load()
  }

  // ── Catégories ──
  function newCat() { setCatForm(EMPTY_CAT); setCatOpen(true) }
  function editCat(c: Category) {
    setCatForm({ id: c.id, nom_fr: c.nom_fr, desc_fr: c.desc_fr || '', actif: c.actif })
    setCatOpen(true)
  }
  async function saveCat() {
    if (!catForm.nom_fr) return
    setSaving(true)
    const payload = {
      slug: slugify(catForm.nom_fr),
      nom_fr: catForm.nom_fr,
      desc_fr: catForm.desc_fr || null,
      actif: catForm.actif,
    }
    if (catForm.id) await supabase.from('categories').update(payload).eq('id', catForm.id)
    else await supabase.from('categories').insert({ ...payload, ordre: cats.length + 1 })
    setSaving(false); setCatOpen(false); load()
  }
  async function delCat(id: string) {
    const n = svcs.filter(s => s.category_id === id).length
    if (n > 0) { alert(`Impossible : ${n} prestation(s) utilisent cette catégorie.`); return }
    if (!confirm('Supprimer cette catégorie ?')) return
    await supabase.from('categories').delete().eq('id', id); load()
  }

  const shown = filterCat ? svcs.filter(s => s.category_id === filterCat) : svcs
  const catName = (id: string) => cats.find(c => c.id === id)?.nom_fr || '—'

  return (
    <div className="pg" style={{ padding:'26px 26px 60px' }}>
      <div className="ph">
        <div>
          <h1>Prestations</h1>
          <div className="sub">{svcs.length} prestation{svcs.length>1?'s':''} · {cats.length} catégorie{cats.length>1?'s':''}</div>
        </div>
        <button className="b-gold" onClick={tab==='services' ? newSvc : newCat}>
          + {tab==='services' ? 'Prestation' : 'Catégorie'}
        </button>
      </div>

      <div className="tabs">
        <button className={tab==='services'?'on':''} onClick={()=>setTab('services')}>Prestations</button>
        <button className={tab==='categories'?'on':''} onClick={()=>setTab('categories')}>Catégories</button>
      </div>

      {/* ══ PRESTATIONS ══ */}
      {tab === 'services' && (
        <>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            <button className={`chip${!filterCat?' on':''}`} onClick={()=>setFilterCat('')}>
              Toutes ({svcs.length})
            </button>
            {cats.map(c => (
              <button key={c.id} className={`chip${filterCat===c.id?' on':''}`} onClick={()=>setFilterCat(c.id)}>
                {c.nom_fr} ({svcs.filter(s=>s.category_id===c.id).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rows">{Array.from({length:5}).map((_,i)=><div key={i} className="skel" style={{height:56}}/>)}</div>
          ) : shown.length === 0 ? (
            <div className="empty">Aucune prestation dans cette catégorie.</div>
          ) : (
            <div className="rows">
              {shown.map(s => (
                <div key={s.id} className="row"
                  style={{ gridTemplateColumns:'1fr auto auto auto', opacity: s.actif?1:0.5 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:T.black }}>
                      {s.nom_fr}
                      {s.is_pmu && <span className="badge" style={{ background:'#F3EAF8', color:'#7B4BA8', marginLeft:8 }}>PMU</span>}
                    </div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                      {catName(s.category_id)} · {s.duree_minutes} min
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.gold, whiteSpace:'nowrap' }}>
                    {s.prix_sur_devis ? 'Sur devis' : FDJ(s.prix)}
                  </div>
                  <button className={`sw${s.actif?' on':''}`} onClick={()=>toggleSvc(s.id, !s.actif)} />
                  <div style={{ display:'flex', gap:5 }}>
                    <button className="b-icon" onClick={()=>editSvc(s)}>✎</button>
                    <button className="b-icon" style={{ color:'#D14343' }} onClick={()=>delSvc(s.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ CATÉGORIES ══ */}
      {tab === 'categories' && (
        loading ? (
          <div className="rows">{Array.from({length:4}).map((_,i)=><div key={i} className="skel" style={{height:56}}/>)}</div>
        ) : (
          <div className="rows">
            {cats.map(c => (
              <div key={c.id} className="row"
                style={{ gridTemplateColumns:'1fr auto auto', opacity: c.actif?1:0.5 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:T.black }}>{c.nom_fr}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                    {svcs.filter(s=>s.category_id===c.id).length} prestation(s)
                    {c.desc_fr && ` · ${c.desc_fr}`}
                  </div>
                </div>
                <button className={`sw${c.actif?' on':''}`}
                  onClick={async()=>{ await supabase.from('categories').update({actif:!c.actif}).eq('id',c.id); load() }} />
                <div style={{ display:'flex', gap:5 }}>
                  <button className="b-icon" onClick={()=>editCat(c)}>✎</button>
                  <button className="b-icon" style={{ color:'#D14343' }} onClick={()=>delCat(c.id)}>×</button>
                </div>
              </div>
            ))}
            {cats.length === 0 && <div className="empty">Aucune catégorie.</div>}
          </div>
        )
      )}

      {/* ══ MODAL PRESTATION ══ */}
      {svcOpen && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setSvcOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>{svcForm.id ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
              <button className="b-icon" onClick={()=>setSvcOpen(false)}>×</button>
            </div>

            <label className="lbl">Nom *</label>
            <input className="f" value={svcForm.nom_fr}
              onChange={e=>setSvcForm(f=>({...f,nom_fr:e.target.value}))}
              placeholder="Powder Brows" />

            <div style={{ height:12 }}/>
            <label className="lbl">Catégorie *</label>
            <select className="f" value={svcForm.category_id}
              onChange={e=>setSvcForm(f=>({...f,category_id:e.target.value}))}>
              <option value="">Choisir...</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.nom_fr}</option>)}
            </select>

            <div style={{ height:12 }}/>
            <label className="lbl">Description</label>
            <textarea className="f" style={{ minHeight:70, resize:'vertical' }} value={svcForm.desc_fr}
              onChange={e=>setSvcForm(f=>({...f,desc_fr:e.target.value}))} />

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Prix (FDJ)</label>
                <input className="f" type="number" value={svcForm.prix} disabled={svcForm.prix_sur_devis}
                  onChange={e=>setSvcForm(f=>({...f,prix:e.target.value}))}
                  style={svcForm.prix_sur_devis?{opacity:.4}:undefined} />
              </div>
              <div>
                <label className="lbl">Durée (min)</label>
                <input className="f" type="number" value={svcForm.duree_minutes}
                  onChange={e=>setSvcForm(f=>({...f,duree_minutes:e.target.value}))} />
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              {([
                ['prix_sur_devis','Prix sur devis'],
                ['is_pmu','Prestation PMU (suivi retouches)'],
                ['actif','Visible sur le site'],
              ] as const).map(([k,label])=>(
                <label key={k} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                  <button className={`sw${svcForm[k]?' on':''}`} type="button"
                    onClick={()=>setSvcForm(f=>({...f,[k]:!f[k]}))} />
                  <span style={{ fontSize:13, color:T.black }}>{label}</span>
                </label>
              ))}
            </div>

            <div style={{ display:'flex', gap:9, marginTop:22 }}>
              <button className="b-ghost" onClick={()=>setSvcOpen(false)}>Annuler</button>
              <button className="b-primary" style={{flex:1}} onClick={saveSvc}
                disabled={saving||!svcForm.nom_fr||!svcForm.category_id}>
                {saving?'Enregistrement...':svcForm.id?'Enregistrer':'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CATÉGORIE ══ */}
      {catOpen && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setCatOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>{catForm.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button className="b-icon" onClick={()=>setCatOpen(false)}>×</button>
            </div>

            <label className="lbl">Nom *</label>
            <input className="f" value={catForm.nom_fr}
              onChange={e=>setCatForm(f=>({...f,nom_fr:e.target.value}))}
              placeholder="PMU — Sourcils" />

            <div style={{ height:12 }}/>
            <label className="lbl">Description</label>
            <input className="f" value={catForm.desc_fr}
              onChange={e=>setCatForm(f=>({...f,desc_fr:e.target.value}))} />

            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop:16 }}>
              <button className={`sw${catForm.actif?' on':''}`} type="button"
                onClick={()=>setCatForm(f=>({...f,actif:!f.actif}))} />
              <span style={{ fontSize:13, color:T.black }}>Visible sur le site</span>
            </label>

            <div style={{ display:'flex', gap:9, marginTop:22 }}>
              <button className="b-ghost" onClick={()=>setCatOpen(false)}>Annuler</button>
              <button className="b-primary" style={{flex:1}} onClick={saveCat} disabled={saving||!catForm.nom_fr}>
                {saving?'Enregistrement...':catForm.id?'Enregistrer':'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
