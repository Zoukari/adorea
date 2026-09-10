/**
 * ADORÉA — Setup automatique Vercel
 * node setup-vercel.js VOTRE_TOKEN_VERCEL
 * 
 * Token Vercel: https://vercel.com/account/tokens → New Token
 */

const token = process.argv[2]
if (!token) {
  console.log('Usage: node setup-vercel.js <VERCEL_TOKEN>')
  console.log('Token: https://vercel.com/account/tokens')
  process.exit(1)
}

const ENV_VARS = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://dlqhlcaaedrrwhtcgzbz.supabase.co',
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjMyOTUsImV4cCI6MjEwNDYzOTI5NX0.XxSWinxbZGEQqGJBcXtRdAOQFZVjLrZBhciS0xayuE0',
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA2MzI5NSwiZXhwIjoyMTA0NjM5Mjk1fQ.MXK9oYfSG3coahvkYb81LDLhjG0hNrfDWQMK7c_ALnc',
    type: 'sensitive',
    target: ['production', 'preview'],
  },
  {
    key: 'NEXT_PUBLIC_WA_NUMBER',
    value: '25377596159',
    type: 'plain',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'https://adorea-dj.com',
    type: 'plain',
    target: ['production'],
  },
]

async function setup() {
  console.log('🔍 Recherche du projet adorea...')
  
  // Trouver le projet
  const projectsRes = await fetch('https://api.vercel.com/v9/projects?limit=100', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const projects = await projectsRes.json()
  const project = projects.projects?.find(p => p.name === 'adorea')
  
  let projectId = project?.id

  if (!projectId) {
    console.log('📁 Création du projet adorea...')
    const createRes = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'adorea',
        framework: 'nextjs',
        gitRepository: { type: 'github', repo: 'Zoukari/adorea' },
      }),
    })
    const created = await createRes.json()
    projectId = created.id
    console.log('✅ Projet créé:', projectId)
  } else {
    console.log('✅ Projet trouvé:', projectId)
  }

  console.log('🔑 Configuration des variables d\'environnement...')
  
  const envRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(ENV_VARS),
  })
  const envResult = await envRes.json()
  
  if (Array.isArray(envResult)) {
    console.log(`✅ ${envResult.length} variables configurées!`)
  } else if (envResult.error) {
    // Variables peut-être déjà existantes, on les met à jour
    console.log('⚠️  Mise à jour des variables existantes...')
    for (const env of ENV_VARS) {
      await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([env]),
      })
    }
    console.log('✅ Variables mises à jour!')
  }

  // Déclencher un redeploy
  console.log('🚀 Déclenchement du déploiement...')
  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'adorea',
      gitSource: { type: 'github', org: 'Zoukari', repo: 'adorea', ref: 'main' },
    }),
  })
  const deploy = await deployRes.json()
  
  if (deploy.url) {
    console.log('')
    console.log('🎉 ADORÉA est en cours de déploiement!')
    console.log('   URL:', `https://${deploy.url}`)
    console.log('   Dashboard: https://vercel.com/Zoukari/adorea')
    console.log('')
    console.log('📌 Pour ajouter adorea-dj.com:')
    console.log('   https://vercel.com/Zoukari/adorea/settings/domains')
  } else {
    console.log('Deploy réponse:', JSON.stringify(deploy, null, 2))
  }
}

setup().catch(console.error)
