/**
 * ADORÉA — Setup Vercel
 * node setup-vercel.js VERCEL_TOKEN
 */

const token = process.argv[2]
if (!token) {
  console.log('Usage: node setup-vercel.js VERCEL_TOKEN')
  process.exit(1)
}

const PROJECT_ID = 'prj_WmbbPencCpQPBH8JxadmENUkUYep'
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

const ENV_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL',      value: 'https://dlqhlcaaedrrwhtcgzbz.supabase.co', type: 'plain',     target: ['production','preview','development'] },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjMyOTUsImV4cCI6MjEwNDYzOTI5NX0.XxSWinxbZGEQqGJBcXtRdAOQFZVjLrZBhciS0xayuE0', type: 'plain', target: ['production','preview','development'] },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',     value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA2MzI5NSwiZXhwIjoyMTA0NjM5Mjk1fQ.MXK9oYfSG3coahvkYb81LDLhjG0hNrfDWQMK7c_ALnc', type: 'sensitive', target: ['production','preview'] },
  { key: 'NEXT_PUBLIC_WA_NUMBER',         value: '25377596159', type: 'plain', target: ['production','preview','development'] },
  { key: 'NEXT_PUBLIC_SITE_URL',          value: 'https://adorea-dj.com', type: 'plain', target: ['production'] },
]

async function api(method, path, body) {
  const r = await fetch(`https://api.vercel.com${path}`, {
    method, headers: H, body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

async function main() {
  // 1. Vérifier projet
  const proj = await api('GET', `/v9/projects/${PROJECT_ID}`)
  console.log('✅ Projet:', proj.name)

  // 2. Connecter GitHub si pas encore fait
  if (!proj.link?.repo) {
    console.log('🔗 Connexion GitHub → Vercel...')
    const link = await api('PATCH', `/v9/projects/${PROJECT_ID}`, {
      link: {
        type: 'github',
        repo: 'Zoukari/adorea',
        org: 'Zoukari',
        productionBranch: 'main',
      }
    })
    if (link.link?.repo) {
      console.log('✅ GitHub connecté! Chaque push déploiera automatiquement.')
    } else {
      console.log('⚠️  Connexion GitHub à faire manuellement:')
      console.log('   vercel.com/Zoukari/adorea → Settings → Git → Connect')
    }
  } else {
    console.log('✅ GitHub déjà connecté:', proj.link.repo)
  }

  // 3. Variables d'env
  console.log('🔑 Variables d\'environnement...')
  const existing = await api('GET', `/v9/projects/${PROJECT_ID}/env`)
  const existingMap = {}
  for (const e of existing.envs || []) existingMap[e.key] = e.id

  for (const env of ENV_VARS) {
    if (existingMap[env.key]) {
      await api('PATCH', `/v9/projects/${PROJECT_ID}/env/${existingMap[env.key]}`, { value: env.value, type: env.type, target: env.target })
    } else {
      await api('POST', `/v9/projects/${PROJECT_ID}/env`, [env])
    }
  }
  console.log('✅ 5 variables configurées')

  // 4. Deploy
  console.log('🚀 Deploy en cours...')
  const d = await api('POST', '/v13/deployments', {
    name: 'adorea',
    projectId: PROJECT_ID,
    gitSource: { type: 'github', org: 'Zoukari', repo: 'adorea', ref: 'main' }
  })

  if (d.url) {
    console.log('\n🎉 Déployé:', `https://${d.url}`)
    console.log('📊 Dashboard: https://vercel.com/Zoukari/adorea')
    console.log('\n✅ À partir de maintenant: git push = deploy automatique!')
  }
}

main().catch(console.error)
