'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Client, Appointment, PmuRecord, ClientHealthForm, ClientReward } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

type Tab = 'identite' | 'historique' | 'sante' | 'pmu' | 'fidelite' | 'notes'

interface ClientDetail extends Client {
  appointments?: (Appointment & { service?: { nom_fr: string }; employee?: { prenom: string; nom: string } })[]
  health_forms?: ClientHealthForm[]
  pmu_records?: PmuRecord[]
  rewards?: ClientReward[]
}

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClientDetail | null>(null)
  const [tab, setTab] = useState<Tab>('identite')
  const [creating, setCreating] = useState(false)
  const [newClient, setNewClient] = useState({ nom: '', prenom: '', telephone: '', email: '', date_naissance: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (search) q = q.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,telephone.ilike.%${search}%`)
    const { data } = await q.limit(80)
    setClients((data as Client[]) || [])
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  async function openClient(c: Client) {
    const [apptRes, healthRes, pmuRes, rewardRes] = await Promise.all([
      supabase.from('appointments')
        .select('*, service:services(nom_fr), employee:employees(prenom,nom)')
        .eq('client_id', c.id).order('date_rdv', { ascending: false }).limit(20),
      supabase.from('client_health_forms').select('*').eq('client_id', c.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('pmu_records').select('*, service:services(nom_fr), photos:pmu_photos(*)').eq('client_id', c.id),
      supabase.from('client_rewards').select('*').eq('client_id', c.id).order('created_at', { ascending: false }),
    ])
    setSelected({
      ...c,
      appointments: (apptRes.data as ClientDetail['appointments']) || [],
      health_forms:  (healthRes.data as ClientHealthForm[]) || [],
      pmu_records:   (pmuRes.data as PmuRecord[]) || [],
      rewards:       (rewardRes.data as ClientReward[]) || [],
    })
    setTab('identite')
  }

  async function saveNewClient() {
    if (!newClient.nom || !newClient.prenom || !newClient.telephone) return
    setSaving(true)
    const { data } = await supabase.from('clients').insert({
      nom: newClient.nom, prenom: newClient.prenom,
      telephone: newClient.telephone,
      email: newClient.email || null,
      date_naissance: newClient.date_naissance || null,
    }).select().single()
    if (data) { setCreating(false); setNewClient({ nom:'',prenom:'',telephone:'',email:'',date_naissance:'' }); load() }
    setSaving(false)
  }

  async function updateNotes(id: string, notes: string) {
    await supabase.from('clients').update({ notes_internes: notes }).eq('id', id)
  }

  async function sendWA(tel: string, prenom: string) {
    const msg = `Bonjour ${prenom},\n\nNous vous contactons de la part d'ADORÉA.\n\nÀ très bientôt ✨\n+253 77 59 61 59`
    window.open(`https://wa.me/${tel.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const TABS: { key: Tab; label: string }[] = [
    { key:'identite', label:'Identité' },
    { key:'historique', label:'Historique' },
    { key:'sante', label:'Santé' },
    { key:'pmu', label:'PMU' },
    { key:'fidelite', label:'Fidélité' },
    { key:'notes', label:'Notes' },
  ]

  const STATUS_COLORS: Record<string, string> = {
    terminee:'#4CAF50', confirmee:'#C9A96A', annulee:'#F44336',
    creee:'#8A7A74', en_cours:'#5C9BD6', absente:'#F44336'
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* LEFT — Liste */}
      <div style={{ width:320, background:'white', borderRight:`1px solid ${T.beige}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'24px 20px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:300 }}>Clientes</h1>
            <button onClick={() => setCreating(true)} style={{
              padding:'7px 14px', borderRadius:4, border:'none', cursor:'pointer',
              background:T.black, color:T.offwhite, fontSize:11, fontWeight:600, fontFamily:'Manrope,sans-serif'
            }}>+ Nouvelle</button>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher nom, téléphone..."
            style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', color:T.black }}
          />
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:20, color:T.muted, fontSize:13 }}>Chargement...</div>
          ) : clients.map(c => (
            <div key={c.id} onClick={() => openClient(c)} style={{
              padding:'14px 20px', cursor:'pointer', borderBottom:`1px solid ${T.beige}`,
              background: selected?.id === c.id ? T.offwhite : 'white',
              borderLeft: selected?.id === c.id ? `3px solid ${T.gold}` : '3px solid transparent',
              transition:'all 0.1s',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:T.black }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{c.telephone}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.gold }}>{c.total_prestations} RDV</div>
                  {c.total_depense > 0 && <div style={{ fontSize:10, color:T.muted }}>{FDJ(c.total_depense)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Détail */}
      <div style={{ flex:1, overflowY:'auto', background:T.offwhite }}>
        {!selected && !creating && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:T.muted, fontSize:13 }}>
            Sélectionner une cliente
          </div>
        )}

        {/* CRÉER CLIENTE */}
        {creating && (
          <div style={{ padding:40, maxWidth:480 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
              <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:26, fontWeight:300 }}>Nouvelle cliente</h2>
              <button onClick={() => setCreating(false)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>
            {[
              { key:'prenom', label:'Prénom *', type:'text' },
              { key:'nom', label:'Nom *', type:'text' },
              { key:'telephone', label:'Téléphone *', type:'tel' },
              { key:'email', label:'Email', type:'email' },
              { key:'date_naissance', label:'Date de naissance', type:'date' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type}
                  value={(newClient as Record<string, string>)[f.key]}
                  onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', padding:'11px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            ))}
            <button onClick={saveNewClient} disabled={saving} style={{
              width:'100%', padding:'13px', borderRadius:4, border:'none', cursor:'pointer',
              background:T.black, color:T.offwhite, fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif', marginTop:8
            }}>{saving ? 'Enregistrement...' : 'Créer la cliente'}</button>
          </div>
        )}

        {/* FICHE CLIENTE */}
        {selected && !creating && (
          <div style={{ padding:40, maxWidth:800 }}>
            {/* Header cliente */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:28 }}>
              <div>
                <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300, color:T.black }}>
                  {selected.prenom} {selected.nom}
                </h2>
                <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{selected.telephone}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => sendWA(selected.telephone, selected.prenom)} style={{
                  padding:'9px 16px', borderRadius:4, border:'none', cursor:'pointer',
                  background:'#25D366', color:'white', fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif',
                }}>💬 WhatsApp</button>
                <button onClick={() => setSelected(null)} style={{ background:'transparent', border:`1px solid ${T.beige}`, borderRadius:4, padding:'9px 14px', cursor:'pointer', fontSize:12, color:T.muted, fontFamily:'Manrope,sans-serif' }}>Fermer</button>
              </div>
            </div>

            {/* Stats rapides */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
              {[
                { l:'Prestations', v:selected.total_prestations.toString() },
                { l:'Total dépensé', v:FDJ(selected.total_depense) },
                { l:'Panier moyen', v: selected.total_prestations > 0 ? FDJ(selected.total_depense / selected.total_prestations) : '—' },
                { l:'Dernière visite', v: selected.derniere_visite ? new Date(selected.derniere_visite).toLocaleDateString('fr-FR') : '—' },
              ].map(s => (
                <div key={s.l} style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:'14px 16px' }}>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:6 }}>{s.l}</div>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, fontWeight:300, color:T.gold }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:2, marginBottom:24, background:'white', borderRadius:6, padding:4, border:`1px solid ${T.beige}` }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex:1, padding:'8px 4px', borderRadius:4, border:'none', cursor:'pointer',
                  background: tab === t.key ? T.black : 'transparent',
                  color: tab === t.key ? T.offwhite : T.muted,
                  fontSize:11, fontWeight:500, fontFamily:'Manrope,sans-serif', transition:'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Tab contenu */}
            {tab === 'identite' && (
              <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:24 }}>
                {[
                  { l:'Nom complet', v:`${selected.prenom} ${selected.nom}` },
                  { l:'Téléphone', v:selected.telephone },
                  { l:'Email', v:selected.email || '—' },
                  { l:'Date de naissance', v: selected.date_naissance ? new Date(selected.date_naissance).toLocaleDateString('fr-FR') : '—' },
                  { l:'Cliente depuis', v: new Date(selected.created_at).toLocaleDateString('fr-FR') },
                ].map(r => (
                  <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${T.beige}` }}>
                    <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', color:T.muted, textTransform:'uppercase' }}>{r.l}</span>
                    <span style={{ fontSize:13, color:T.black }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'historique' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {(selected.appointments || []).length === 0 && (
                  <div style={{ padding:32, textAlign:'center', color:T.muted, fontSize:13 }}>Aucun rendez-vous</div>
                )}
                {(selected.appointments || []).map((a, i) => (
                  <div key={i} style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:T.black }}>{(a.service as { nom_fr: string })?.nom_fr}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{a.date_rdv} · {a.heure_debut?.slice(0,5)} · {(a.employee as { prenom: string; nom: string })?.prenom} {(a.employee as { nom: string })?.nom}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>{FDJ(a.prix_final)}</div>
                      <div style={{ fontSize:11, color: STATUS_COLORS[a.statut] || T.muted, marginTop:2 }}>{a.statut}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'sante' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {(selected.health_forms || []).length === 0 && (
                  <div style={{ padding:32, textAlign:'center', color:T.muted, fontSize:13 }}>Aucun questionnaire enregistré</div>
                )}
                {(selected.health_forms || []).map((h, i) => (
                  <div key={i} style={{ background:'white', border:`1px solid ${h.has_contraindication ? '#E6A817' : T.beige}`, borderRadius:6, padding:20 }}>
                    <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, marginBottom:12 }}>
                      {new Date(h.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                      {h.has_contraindication && <span style={{ color:'#E6A817', marginLeft:8 }}>⚠ Contre-indication</span>}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {[
                        { k:'grossesse', l:'Grossesse' }, { k:'diabete', l:'Diabète' },
                        { k:'allergies', l:'Allergies' }, { k:'traitement_med', l:'Traitement médical' },
                        { k:'pb_peau', l:'Peau' }, { k:'herpes', l:'Herpès' }, { k:'anticoagulants', l:'Anticoagulants' },
                      ].map(f => (
                        <span key={f.k} style={{
                          padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:500,
                          background: (h as unknown as Record<string, boolean>)[f.k] ? '#FFF3E0' : T.offwhite,
                          color: (h as unknown as Record<string, boolean>)[f.k] ? '#E6A817' : T.muted,
                          border: `1px solid ${(h as unknown as Record<string, boolean>)[f.k] ? '#E6A817' : T.beige}`,
                        }}>
                          {(h as unknown as Record<string, boolean>)[f.k] ? '⚠ ' : ''}{f.l}
                        </span>
                      ))}
                    </div>
                    {h.commentaires && <div style={{ fontSize:12, color:T.muted, marginTop:12, padding:'10px 12px', background:T.offwhite, borderRadius:4 }}>{h.commentaires}</div>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'pmu' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {(selected.pmu_records || []).length === 0 && (
                  <div style={{ padding:32, textAlign:'center', color:T.muted, fontSize:13 }}>Aucun dossier PMU</div>
                )}
                {(selected.pmu_records || []).map((p, i) => (
                  <div key={i} style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:20 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.black, marginBottom:12 }}>{(p as { service?: { nom_fr: string } }).service?.nom_fr}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      {[
                        { l:'Pigment', v: p.pigment }, { l:'Technique', v: p.technique },
                        { l:'Retouche avant', v: p.prochaine_retouche_avant ? new Date(p.prochaine_retouche_avant).toLocaleDateString('fr-FR') : '—' },
                        { l:'Retouche après', v: p.prochaine_retouche_apres ? new Date(p.prochaine_retouche_apres).toLocaleDateString('fr-FR') : '—' },
                      ].map(r => (
                        <div key={r.l}>
                          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:4 }}>{r.l}</div>
                          <div style={{ fontSize:13, color:T.black }}>{r.v || '—'}</div>
                        </div>
                      ))}
                    </div>
                    {p.notes && <div style={{ fontSize:12, color:T.muted, padding:'10px 12px', background:T.offwhite, borderRadius:4 }}>{p.notes}</div>}
                    {/* Photos */}
                    {(p as { photos?: { url: string; type: string }[] }).photos && (p as { photos?: { url: string; type: string }[] }).photos!.length > 0 && (
                      <div style={{ display:'flex', gap:8, marginTop:12 }}>
                        {(p as { photos?: { url: string; type: string }[] }).photos!.map((ph, j) => (
                          <div key={j} style={{ position:'relative' }}>
                            <img src={ph.url} alt={ph.type} style={{ width:80, height:80, objectFit:'cover', borderRadius:4, border:`1px solid ${T.beige}` }} />
                            <div style={{ position:'absolute', bottom:4, left:4, background:'rgba(26,26,26,0.7)', color:'white', fontSize:9, padding:'2px 6px', borderRadius:2 }}>{ph.type}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'fidelite' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:20 }}>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:12 }}>Progression</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1, height:6, background:T.beige, borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:T.gold, borderRadius:3, width:`${Math.min(100, (selected.total_prestations % 5) * 20)}%`, transition:'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.gold, whiteSpace:'nowrap' }}>
                      {selected.total_prestations % 5}/5
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:8 }}>À 5 prestations : -20% sur la prochaine</div>
                </div>
                {(selected.rewards || []).length === 0 && (
                  <div style={{ padding:20, textAlign:'center', color:T.muted, fontSize:13 }}>Aucune récompense débloquée</div>
                )}
                {(selected.rewards || []).map((r, i) => (
                  <div key={i} style={{ background: r.utilise ? T.offwhite : 'white', border:`1px solid ${r.utilise ? T.beige : T.gold}`, borderRadius:6, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color: r.utilise ? T.muted : T.black }}>
                        {r.reward_type === 'reduction_pct' ? `-${r.reward_valeur}%` : r.reward_type === 'reduction_fixe' ? `-${FDJ(r.reward_valeur || 0)}` : r.code_bon}
                      </div>
                      {r.expire_at && <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Expire {new Date(r.expire_at).toLocaleDateString('fr-FR')}</div>}
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color: r.utilise ? T.muted : T.gold }}>
                      {r.utilise ? 'Utilisé' : 'Actif'}
                    </span>
                  </div>
                ))}
                {/* WA fidélité */}
                {(selected.rewards || []).some(r => !r.utilise) && (
                  <button onClick={() => {
                    const reward = (selected.rewards || []).find(r => !r.utilise)
                    const msg = `Bonjour ${selected.prenom},\n\nvous venez de débloquer une récompense ADORÉA ✨\n\nRécompense : ${reward?.reward_type === 'reduction_pct' ? `-${reward?.reward_valeur}%` : reward?.code_bon}\n${reward?.expire_at ? `Validité : jusqu'au ${new Date(reward.expire_at).toLocaleDateString('fr-FR')}` : ''}\n\nNous serons ravies de vous recevoir à nouveau.`
                    window.open(`https://wa.me/${selected.telephone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
                  }} style={{
                    padding:'12px', borderRadius:4, border:'none', cursor:'pointer',
                    background:'#25D366', color:'white', fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
                  }}>💬 Envoyer l&apos;offre par WhatsApp</button>
                )}
              </div>
            )}

            {tab === 'notes' && (
              <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:20 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:12 }}>Notes internes</div>
                <textarea
                  defaultValue={selected.notes_internes || ''}
                  onBlur={e => updateNotes(selected.id, e.target.value)}
                  placeholder="Notes visibles uniquement par l'équipe..."
                  style={{ width:'100%', minHeight:160, padding:'12px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, resize:'vertical', outline:'none', color:T.black }}
                />
                <div style={{ fontSize:11, color:T.muted, marginTop:8 }}>Sauvegarde automatique à la perte de focus</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
