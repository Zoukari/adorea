import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Service, Category, Promotion } from '@/types'

export interface ServiceWithPromo extends Service {
  category: Category
  promotion: Promotion | null
  prix_promo: number | null
}

export function useServices() {
  const [services, setServices] = useState<ServiceWithPromo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [srvRes, catRes] = await Promise.all([
        supabase
          .from('services')
          .select(`
            *,
            category:categories(*),
            promotion:promotions(*)
          `)
          .eq('actif', true)
          .order('ordre'),
        supabase
          .from('categories')
          .select('*')
          .eq('actif', true)
          .order('ordre'),
      ])

      const today = new Date().toISOString().split('T')[0]

      const svcs = ((srvRes.data || []) as ServiceWithPromo[]).map(s => {
        // Trouver promo active
        const promo = Array.isArray(s.promotion)
          ? (s.promotion as Promotion[]).find(p =>
              p.actif &&
              p.date_debut <= today &&
              p.date_fin >= today
            ) || null
          : s.promotion

        let prix_promo: number | null = null
        if (promo) {
          if (promo.remise_pct)   prix_promo = s.prix * (1 - promo.remise_pct / 100)
          if (promo.remise_fixe)  prix_promo = Math.max(0, s.prix - promo.remise_fixe)
        }

        return { ...s, promotion: promo, prix_promo }
      })

      setServices(svcs)
      setCategories((catRes.data as Category[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const byCategory = categories.map(cat => ({
    cat,
    services: services.filter(s => s.category_id === cat.id),
  }))

  return { services, categories, byCategory, loading }
}
