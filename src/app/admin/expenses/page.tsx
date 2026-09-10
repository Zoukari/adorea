'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Expense, ExpenseCategory } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

const CATEGORIES: { key: ExpenseCategory; label: string }[] = [
  { key:'pigments', label:'Pigments' }, { key:'makeup', label:'Makeup' },
  { key:'nails', label:'Nails' }, { key:'consommables', label:'Consommables' },
  { key:'hygiene', label:'Hygiène' }, { key:'materiel', label:'Matériel' },
  { key:'mobilier', label:'Mobilier' }, { key:'marketing', label:'Marketing' },
  { key:'transport', label:'Transport' }, { key:'autre', label:'Autre' },
]

const EMPTY: Partial<Expense> = {
  date_depense: new Date().toISOString().split('T')[0],
  produit: '', categorie: 'consommables', quantite: 1, montant: 0,
  marque: '', fournisseur: '', notes: '',
}

export default function ExpensesPage() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Partial<Expense>>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [totalMonth, setTotalMonth] = useState(0)
  const [filterCat, setFilterCat] = useState<string>('all')

  async function load() {
    setLoading(true)
    const firstDay = new Date(); firstDay.setDate(1)
    let q = supabase.from('expenses').select('*').order('date_depense', { ascending: false }).limit(100)
    if (filterCat !== 'all') q = q.eq('categorie', filterCat)
    const { data } = await q
    setExpenses((data as Expense[]) || [])

    // Total du mois
    const { data: monthData } = await supabase.from('expenses').select('montant')
      .gte('date_depense', firstDay.toISOString().split('T')[0])
    setTotalMonth((monthData || []).reduce((s: number, e: { montant: number }) => s + e.montant, 0))
    setLoading(false)
  }

  useEffect(() => { load() }, [filterCat])

  async function save() {
    if (!form.produit || !form.montant) return
    setSaving(true)
    await supabase.from('expenses').insert({
      date_depense: form.date_depense,
      produit:      form.produit,
      categorie:    form.categorie,
      quantite:     form.quantite || 1,
      montant:      form.montant,
      marque:       form.marque || null,
      fournisseur:  form.fournisseur || null,
      notes:        form.notes || null,
    })
    setAdding(false); setForm(EMPTY); load()
    setSaving(false)
  }

  async function deleteExpense(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  const catLabel = (key: string) => CATEGORIES.find(c => c.key === key)?.label || key

  return (
    <div style={{ padding:32, maxWidth:1000 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Dépenses</h1>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Ce mois : <strong style={{ color:T.black }}>{FDJ(totalMonth)}</strong></div>
        </div>
        <button onClick={() => setAdding(true)} style={{
          padding:'10px 20px', borderRadius:4, border:'none', cursor:'pointer',
          background:T.black, color:T.offwhite, fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif',
        }}>+ Ajouter</button>
      </div>

      {/* Filtre catégorie */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        <button onClick={() => setFilterCat('all')} style={{
          padding:'6px 14px', borderRadius:20, border:`1px solid ${filterCat==='all' ? T.black : T.beige}`,
          background: filterCat==='all' ? T.black : 'white', color: filterCat==='all' ? T.offwhite : T.muted,
          fontSize:11, cursor:'pointer', fontFamily:'Manrope,sans-serif',
        }}>Toutes</button>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setFilterCat(c.key)} style={{
            padding:'6px 14px', borderRadius:20, border:`1px solid ${filterCat===c.key ? T.black : T.beige}`,
            background: filterCat===c.key ? T.black : 'white', color: filterCat===c.key ? T.offwhite : T.muted,
            fontSize:11, cursor:'pointer', fontFamily:'Manrope,sans-serif',
          }}>{c.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {expenses.length === 0 && <div style={{ padding:40, textAlign:'center', color:T.muted, fontSize:13 }}>Aucune dépense</div>}
          {expenses.map(e => (
            <div key={e.id} style={{
              display:'grid', gridTemplateColumns:'100px 1fr 120px 100px 80px',
              gap:16, padding:'13px 18px', background:'white', border:`1px solid ${T.beige}`, borderRadius:6, alignItems:'center',
            }}>
              <div style={{ fontSize:12, color:T.muted }}>{new Date(e.date_depense).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:T.black }}>{e.produit}</div>
                {(e.marque || e.fournisseur) && <div style={{ fontSize:11, color:T.muted }}>{e.marque}{e.marque && e.fournisseur ? ' · ' : ''}{e.fournisseur}</div>}
              </div>
              <div style={{
                display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500,
                background:'#F5F0EB', color:T.muted, width:'fit-content',
              }}>{catLabel(e.categorie)}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.black }}>{FDJ(e.montant)}</div>
              <button onClick={() => deleteExpense(e.id)} style={{
                padding:'6px 10px', borderRadius:4, border:`1px solid #F4433620`, background:'transparent',
                cursor:'pointer', fontSize:11, color:'#F44336', fontFamily:'Manrope,sans-serif',
              }}>Suppr.</button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire ajout */}
      {adding && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setAdding(false)}>
          <div style={{ background:T.offwhite, borderRadius:8, padding:36, width:480, maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:300 }}>Nouvelle dépense</h3>
              <button onClick={() => setAdding(false)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>

            {[
              { key:'date_depense', label:'Date *', type:'date' },
              { key:'produit', label:'Produit *', type:'text' },
              { key:'marque', label:'Marque', type:'text' },
              { key:'fournisseur', label:'Fournisseur', type:'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={(form as Record<string, string | number | undefined>)[f.key]?.toString() || ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            ))}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Quantité *</label>
                <input type="number" min={1} value={form.quantite || 1} onChange={e => setForm(p => ({ ...p, quantite: Number(e.target.value) }))}
                  style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Montant FDJ *</label>
                <input type="number" min={0} value={form.montant || ''} onChange={e => setForm(p => ({ ...p, montant: Number(e.target.value) }))}
                  style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Catégorie *</label>
              <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value as ExpenseCategory }))}
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white', color:T.black }}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', resize:'vertical', minHeight:72, background:'white' }} />
            </div>

            <button onClick={save} disabled={saving || !form.produit || !form.montant} style={{
              width:'100%', padding:'13px', borderRadius:4, border:'none', cursor: saving ? 'default' : 'pointer',
              background: form.produit && form.montant ? T.black : T.beige,
              color: form.produit && form.montant ? T.offwhite : T.muted,
              fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
            }}>{saving ? 'Enregistrement...' : 'Ajouter la dépense'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
