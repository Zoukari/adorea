/**
 * ADORÉA — Setup automatique Vercel
 * 
 * Token Vercel (PAS GitHub) :
 * 1. Aller sur https://vercel.com/account/tokens
 * 2. Cliquer "Create Token"
 * 3. Nom: adorea  |  Scope: Full Account  |  Expiry: No Expiration
 * 4. Copier le token (commence par vercel_...)
 * 
 * Usage: node setup-vercel.js vercel_xxxxxxxxxx
 */

const token = process.argv[2]

if (!token) {
  console.log('')
  console.log('❌ Token manquant.')
  console.log('')
  console.log('👉 Obtenir ton token Vercel:')
  console.log('   https://vercel.com/account/tokens')
  console.log('   → Create Token → Full Account → No Expiration')
  console.log('')
  console.log('Usage: node setup-vercel.js TON_TOKEN_VERCEL')
  process.exit(1)
}

const SUPABASE_URL      = 'https://dlqhlcaaedrrwhtcgzbz.supabase.co'
const SUPABASE_ANON     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjMyOTUsImV4cCI6MjEwNDYzOTI5NX0.XxSWinxbZGEQqGJBcXtRdAOQFZVjLrZBhciS0xayuE0'
const SUPABASE_SERVICE  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA2MzI5NSwiZXhwIjoyMTA0NjM5Mjk1fQ.MXK9oYfSG3coahvkYb81LDLhjG0hNrfDWQMK7c_ALnc'

const ENV_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL',      value: SUPABASE_URL,     type: 'plain',     target: ['production','preview','development'] },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: SUPABASE_ANON,    type: 'plain',     target: ['production','preview','development'] },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',     value: SUPABASE_SERVICE, type: 'sensitive', target: ['production','preview'] },
  { key: 'NEXT_PUBLIC_WA_NUMBER',         value: '25377596159',    type: 'plain',     target: ['production','preview','development'] },
  { key: 'NEXT_PUBLIC_SITE_URL',          value: 'https://adorea-dj.com', type: 'plain', target: ['production'] },
]

const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function api(method, path, body) {
  const r = await fetch(`https://api.vercel.com${path}`, {
    method, headers: H, body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

async function main() {
  // 1. Vérifier le token
  console.log('🔐 Vérification du token...')
  const me = await api('GET', '/v2/user')
  if (me.error) {
    console.log('❌ Token invalide:', me.error.message)
    console.log('')
    console.log('👉 Crée un token sur: https://vercel.com/account/tokens')
    process.exit(1)
  }
  console.log(`✅ Connecté: ${me.user.username} (${me.user.email})`)

  // 2. Chercher ou créer le projet
  console.log('\n🔍 Recherche du projet adorea...')
  const projects = await api('GET', '/v9/projects?limit=100')
  let project = projects.projects?.find(p => p.name === 'adorea')

  if (!project) {
    console.log('📁 Création du projet...')
    project = await api('POST', '/v9/projects', {
      name: 'adorea',
      framework: 'nextjs',
      gitRepository: { type: 'github', repo: 'Zoukari/adorea' },
      environmentVariables: ENV_VARS,
    })
    if (project.error) {
      console.log('⚠️  Erreur création:', project.error.message)
    } else {
      console.log(`✅ Projet créé: ${project.id}`)
      console.log('\n🎉 Tout est configuré!')
      console.log('   Dashboard: https://vercel.com/dashboard')
      console.log('   Domaine: https://vercel.com/dashboard → adorea → Settings → Domains')
      return
    }
  } else {
    console.log(`✅ Projet trouvé: ${project.name} (${project.id})`)
  }

  // 3. Ajouter/mettre à jour les env vars
  console.log('\n🔑 Configuration des variables d\'environnement...')
  
  // Récupérer les env vars existantes
  const existing = await api('GET', `/v9/projects/${project.id}/env`)
  const existingKeys = new Set((existing.envs || []).map(e => e.key))

  for (const env of ENV_VARS) {
    if (existingKeys.has(env.key)) {
      // Trouver l'ID et mettre à jour
      const existingEnv = (existing.envs || []).find(e => e.key === env.key)
      if (existingEnv) {
        await api('PATCH', `/v9/projects/${project.id}/env/${existingEnv.id}`, {
          value: env.value, type: env.type, target: env.target,
        })
        console.log(`  ↻ ${env.key} mis à jour`)
      }
    } else {
      // Créer
      await api('POST', `/v9/projects/${project.id}/env`, [env])
      console.log(`  + ${env.key} ajouté`)
    }
  }

  // 4. Déclencher un redeploy via un nouveau commit (le projet est déjà lié à GitHub)
  console.log('\n✅ Variables configurées!')
  console.log('\n📋 Résumé:')
  console.log(`   Projet: https://vercel.com/dashboard`)
  console.log(`   Pour déclencher un deploy: git commit --allow-empty -m "trigger deploy" && git push`)
  console.log(`   Ou depuis Vercel: Dashboard → adorea → Deployments → Redeploy`)
  console.log('')
  console.log('📌 Pour ajouter adorea-dj.com:')
  console.log('   Dashboard → adorea → Settings → Domains → Add')
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1) })
