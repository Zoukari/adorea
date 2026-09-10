'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { PmuPhoto, PmuRecord } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

interface PhotoWithRecord extends PmuPhoto {
  record?: PmuRecord & { client?: { nom: string; prenom: string }; service?: { nom_fr: string } }
}

export default function GalleryPage() {
  const supabase = createClient()
  const [photos, setPhotos]     = useState<PhotoWithRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'all'|'avant'|'apres'|'public'>('all')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('pmu_photos')
      .select('*, record:pmu_records(*, client:clients(nom,prenom), service:services(nom_fr))')
      .order('created_at', { ascending: false })
      .limit(80)
    setPhotos((data as PhotoWithRecord[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublic(id: string, current: boolean) {
    await supabase.from('pmu_photos').update({ public_gallery: !current }).eq('id', id)
    setPhotos(ps => ps.map(p => p.id === id ? { ...p, public_gallery: !current } : p))
  }

  async function deletePhoto(id: string, url: string) {
    if (!confirm('Supprimer cette photo ?')) return
    // Supprimer du storage
    const path = url.split('/pmu-photos/')[1]
    if (path) await supabase.storage.from('pmu-photos').remove([path])
    await supabase.from('pmu_photos').delete().eq('id', id)
    load()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, recordId: string, type: 'avant'|'apres') {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${recordId}/${type}-${Date.now()}.${file.name.split('.').pop()}`
    const { data: upData, error } = await supabase.storage.from('pmu-photos').upload(path, file, { upsert: true })
    if (!error && upData) {
      const { data: urlData } = supabase.storage.from('pmu-photos').getPublicUrl(path)
      await supabase.from('pmu_photos').insert({ record_id: recordId, url: urlData.publicUrl, type, public_gallery: false })
      load()
    }
    setUploading(false)
  }

  const filtered = photos.filter(p => {
    if (filter === 'avant')  return p.type === 'avant'
    if (filter === 'apres')  return p.type === 'apres'
    if (filter === 'public') return p.public_gallery
    return true
  })

  const publicCount  = photos.filter(p => p.public_gallery).length
  const avantCount   = photos.filter(p => p.type === 'avant').length
  const apresCount   = photos.filter(p => p.type === 'apres').length

  return (
    <div style={{ padding:32, maxWidth:1100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Galerie</h1>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>
            {photos.length} photos · {publicCount} publiques · {avantCount} avant · {apresCount} après
          </div>
        </div>
        <div style={{ display:'flex', gap:4, background:T.beige, borderRadius:6, padding:4 }}>
          {[
            { key:'all',    label:'Toutes' },
            { key:'avant',  label:'Avant' },
            { key:'apres',  label:'Après' },
            { key:'public', label:'Publiques' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} style={{
              padding:'7px 12px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:500,
              background: filter === f.key ? T.black : 'transparent',
              color: filter === f.key ? T.offwhite : T.muted,
              fontFamily:'Manrope,sans-serif',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:T.muted, fontSize:13, border:`1px dashed ${T.beige}`, borderRadius:8 }}>
          Aucune photo dans cette catégorie.<br/>
          <span style={{ fontSize:11 }}>Les photos sont ajoutées depuis la fiche cliente → onglet PMU.</span>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, overflow:'hidden' }}>
              {/* Image */}
              <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden', background:T.beige }}>
                <img src={p.url} alt={p.type} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                <div style={{
                  position:'absolute', top:8, left:8, padding:'3px 8px', borderRadius:12, fontSize:10, fontWeight:600,
                  background: p.type === 'avant' ? 'rgba(26,26,26,0.75)' : 'rgba(201,169,106,0.9)',
                  color:'white', textTransform:'uppercase', letterSpacing:'0.1em',
                }}>{p.type}</div>
                {p.public_gallery && (
                  <div style={{
                    position:'absolute', top:8, right:8, width:22, height:22, borderRadius:11,
                    background:T.gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white',
                  }}>👁</div>
                )}
              </div>

              {/* Infos */}
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontSize:12, fontWeight:500, color:T.black, marginBottom:2 }}>
                  {p.record?.client?.prenom} {p.record?.client?.nom}
                </div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>
                  {p.record?.service?.nom_fr}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', gap:6 }}>
                  <button onClick={() => togglePublic(p.id, p.public_gallery)} style={{
                    flex:1, padding:'6px', borderRadius:4, border:`1px solid ${p.public_gallery ? T.gold : T.beige}`,
                    background: p.public_gallery ? '#FBF7EE' : 'transparent',
                    cursor:'pointer', fontSize:10, fontWeight:500,
                    color: p.public_gallery ? T.gold : T.muted,
                    fontFamily:'Manrope,sans-serif',
                  }}>{p.public_gallery ? 'Publique ✓' : 'Privée'}</button>
                  <button onClick={() => deletePhoto(p.id, p.url)} style={{
                    padding:'6px 10px', borderRadius:4, border:`1px solid #F4433620`,
                    background:'transparent', cursor:'pointer', fontSize:10, color:'#F44336',
                    fontFamily:'Manrope,sans-serif',
                  }}>×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload fictif — la vraie galerie se remplit depuis les fiches PMU */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => handleUpload(e, 'demo-record-id', 'apres')} />

      {uploading && (
        <div style={{ position:'fixed', bottom:24, right:24, background:T.black, color:T.offwhite, padding:'12px 20px', borderRadius:6, fontSize:13, fontWeight:500 }}>
          Upload en cours...
        </div>
      )}
    </div>
  )
}
