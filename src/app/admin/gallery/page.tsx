'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74' }

type SiteImage = {
  id: string; slot: string; url: string
  label: string|null; tag: string|null
  position: string|null; ordre: number; actif: boolean
}

// Regroupement par zone du site
const ZONES: { key:string; titre:string; desc:string; prefixes:string[] }[] = [
  { key:'hero',   titre:'Accueil',        desc:'Grande image en haut du site',            prefixes:['hero'] },
  { key:'brand',  titre:'Notre maison',   desc:'Image de la section présentation',        prefixes:['brand'] },
  { key:'svc',    titre:'Prestations',    desc:'Une image par catégorie de prestations',  prefixes:['svc_'] },
  { key:'gal',    titre:'Notre univers',  desc:'Carrousel défilant du site',              prefixes:['gal_'] },
  { key:'ba',     titre:'Avant / Après',  desc:'Comparatifs glissants',                   prefixes:['ba_'] },
]

const POSITIONS = [
  { v:'top',        l:'Haut' },
  { v:'center 20%', l:'Haut-centre' },
  { v:'center',     l:'Centre' },
  { v:'center 60%', l:'Bas-centre' },
  { v:'bottom',     l:'Bas' },
]

export default function GalleryPage() {
  const supabase = createClient()
  const [images, setImages] = useState<SiteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SiteImage|null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('site_images').select('*').order('ordre')
    setImages((data as SiteImage[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function uploadFile(file: File) {
    if (!editing) return
    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `site/${editing.slot}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('pmu-photos').upload(path, file, { upsert: true, cacheControl: '3600' })

    if (error) { alert('Envoi impossible : ' + error.message); setUploading(false); return }

    const { data: pub } = supabase.storage.from('pmu-photos').getPublicUrl(path)
    setEditing(e => e && ({ ...e, url: pub.publicUrl }))
    setUploading(false)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    await supabase.from('site_images').update({
      url: editing.url,
      label: editing.label,
      tag: editing.tag,
      position: editing.position,
      actif: editing.actif,
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id)
    setSaving(false); setEditing(null); load()
    setToast('Image mise à jour — rechargez le site pour voir le changement')
    setTimeout(()=>setToast(''), 4000)
  }

  async function addSlot(prefix: string) {
    const existing = images.filter(i => i.slot.startsWith(prefix))
    const n = existing.length + 1
    const slot = `${prefix}${n}`
    const maxOrdre = Math.max(0, ...images.map(i => i.ordre))
    await supabase.from('site_images').insert({
      slot, url: '/images/hero-main.webp',
      label: 'Nouvelle image', tag: '', position: 'center',
      ordre: maxOrdre + 1, actif: true,
    })
    load()
  }

  async function addBaPair() {
    const nums = images
      .filter(i => i.slot.startsWith('ba_before_'))
      .map(i => Number(i.slot.replace('ba_before_', '')) || 0)
    const n = (nums.length ? Math.max(...nums) : 0) + 1
    const maxOrdre = Math.max(0, ...images.map(i => i.ordre))
    await supabase.from('site_images').insert([
      { slot:`ba_before_${n}`, url:'/images/ba-before-1.webp',
        label:`Comparatif ${n} — avant`, tag:'AVANT', position:'center',
        ordre: maxOrdre + 1, actif: true },
      { slot:`ba_after_${n}`,  url:'/images/ba-after-1.webp',
        label:`Comparatif ${n} — après`, tag:'APRÈS', position:'center',
        ordre: maxOrdre + 2, actif: true },
    ])
    load()
  }

  async function removeBaPair(img: SiteImage) {
    const n = img.slot.replace(/^ba_(before|after)_/, '')
    if (!confirm(`Retirer le comparatif ${n} du site ?`)) return
    await supabase.from('site_images').delete()
      .in('slot', [`ba_before_${n}`, `ba_after_${n}`])
    load()
  }

  async function removeSlot(img: SiteImage) {
    if (!confirm(`Retirer « ${img.label || img.slot} » du site ?`)) return
    await supabase.from('site_images').delete().eq('id', img.id)
    load()
  }

  const zoneImages = (z: typeof ZONES[0]) =>
    images.filter(i => z.prefixes.some(p => i.slot.startsWith(p)))

  return (
    <div className="pg" style={{ padding:'26px 26px 60px' }}>
      <div className="ph">
        <div>
          <h1>Images du site</h1>
          <div className="sub">Modifiez les photos affichées sur le site vitrine</div>
        </div>
      </div>

      {loading ? (
        <div className="g3">
          {Array.from({length:6}).map((_,i)=><div key={i} className="skel" style={{height:170}}/>)}
        </div>
      ) : images.length === 0 ? (
        <div className="empty" style={{ lineHeight:1.8 }}>
          Aucun emplacement configuré.<br/>
          Lancez la migration <code>10_site_images.sql</code> dans Supabase.
        </div>
      ) : (
        ZONES.map(z => {
          const list = zoneImages(z)
          if (!list.length && !['gal','ba'].includes(z.key)) return null
          return (
            <div key={z.key} style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between',
                gap:12, marginBottom:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:21, color:T.black }}>
                    {z.titre}
                  </div>
                  <div style={{ fontSize:11.5, color:T.muted, marginTop:2 }}>{z.desc}</div>
                </div>
                {z.key === 'gal' && (
                  <button className="b-ghost" onClick={()=>addSlot('gal_')}>+ Ajouter une photo</button>
                )}
                {z.key === 'ba' && (
                  <button className="b-ghost" onClick={addBaPair}>+ Ajouter un comparatif</button>
                )}
              </div>

              {list.length === 0 && (
                <div style={{ padding:'22px 18px', background:'#fff', border:'1.5px dashed #E5DACE',
                  borderRadius:16, fontSize:12.5, color:T.muted, textAlign:'center', lineHeight:1.7 }}>
                  {z.key === 'ba'
                    ? 'Aucun comparatif. Cliquez sur « Ajouter un comparatif » pour créer une paire avant/après.'
                    : 'Aucune image dans cette zone.'}
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
                {list.map(img => (
                  <div key={img.id} style={{
                    background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16,
                    overflow:'hidden', opacity: img.actif ? 1 : .45,
                  }}>
                    <button onClick={()=>setEditing({...img})} style={{
                      display:'block', width:'100%', border:'none', padding:0, cursor:'pointer',
                      background:'#F2EDE8', position:'relative',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.label || img.slot}
                        style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover',
                          objectPosition: img.position || 'center', display:'block' }}/>
                      <span style={{ position:'absolute', top:8, right:8, background:'rgba(10,8,7,.72)',
                        color:'#fff', borderRadius:8, padding:'4px 8px', fontSize:10,
                        fontFamily:'Manrope,sans-serif' }}>✎</span>
                    </button>
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:12.5, fontWeight:500, color:T.black,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {img.label || img.slot}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        marginTop:6 }}>
                        <span style={{ fontSize:10, color:T.muted }}>{img.slot}</span>
                        {z.key === 'gal' && (
                          <button className="b-icon" style={{ width:24, height:24, fontSize:13,
                            borderRadius:7, color:'#D14343' }}
                            onClick={()=>removeSlot(img)}>×</button>
                        )}
                        {z.key === 'ba' && img.slot.startsWith('ba_before_') && (
                          <button className="b-icon" style={{ width:24, height:24, fontSize:13,
                            borderRadius:7, color:'#D14343' }}
                            onClick={()=>removeBaPair(img)}>×</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Modale d'édition */}
      {editing && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div className="mdl" style={{ maxHeight:'92svh', overflowY:'auto' }}>
            <div className="mdl-h">
              <h3>{editing.label || editing.slot}</h3>
              <button className="b-icon" onClick={()=>setEditing(null)}>×</button>
            </div>

            {/* Aperçu */}
            <div style={{ borderRadius:14, overflow:'hidden', background:'#F2EDE8', marginBottom:14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editing.url} alt=""
                style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover',
                  objectPosition: editing.position || 'center', display:'block' }}/>
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e=>{ const f = e.target.files?.[0]; if (f) uploadFile(f) }}/>

            <button className="b-gold" style={{ width:'100%', marginBottom:14 }}
              onClick={()=>fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Envoi en cours...' : '📷 Remplacer la photo'}
            </button>

            <label className="lbl">Cadrage</label>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
              {POSITIONS.map(p=>(
                <button key={p.v} className={`chip${editing.position===p.v?' on':''}`}
                  style={{ padding:'7px 13px', fontSize:11.5 }}
                  onClick={()=>setEditing(e=>e&&({...e,position:p.v}))}>
                  {p.l}
                </button>
              ))}
            </div>

            <label className="lbl">Légende</label>
            <input className="f" value={editing.label || ''}
              onChange={e=>setEditing(x=>x&&({...x,label:e.target.value}))}
              placeholder="Des lèvres sublimées" />

            <label className="lbl" style={{ marginTop:10 }}>Sur-titre</label>
            <input className="f" value={editing.tag || ''}
              onChange={e=>setEditing(x=>x&&({...x,tag:e.target.value}))}
              placeholder="LÈVRES PMU" />

            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop:16 }}>
              <button className={`sw${editing.actif?' on':''}`} type="button"
                onClick={()=>setEditing(x=>x&&({...x,actif:!x.actif}))} />
              <span style={{ fontSize:13, color:T.black }}>Visible sur le site</span>
            </label>

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={()=>setEditing(null)}>Annuler</button>
              <button className="b-primary" style={{ flex:1 }} onClick={save} disabled={saving||uploading}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:600,
          background:T.black, color:'#F9F6F2', padding:'13px 22px', borderRadius:100, fontSize:12.5,
          boxShadow:'0 8px 28px rgba(0,0,0,.3)', maxWidth:'90vw', textAlign:'center' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
