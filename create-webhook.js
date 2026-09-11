/**
 * Crée un webhook GitHub qui déclenche Vercel à chaque push
 * node create-webhook.js VERCEL_TOKEN GITHUB_TOKEN
 */
const [,, VT, GT] = process.argv
if (!VT || !GT) { console.log('Usage: node create-webhook.js VERCEL_TOKEN GITHUB_TOKEN'); process.exit(1) }

const VH = { Authorization: `Bearer ${VT}`, 'Content-Type': 'application/json' }
const GH = { Authorization: `Bearer ${GT}`, 'Content-Type': 'application/json', 'User-Agent': 'adorea' }

async function main() {
  // 1. Créer un Deploy Hook Vercel
  console.log('🔗 Création du Deploy Hook Vercel...')
  const hookRes = await fetch('https://api.vercel.com/v9/projects/prj_WmbbPencCpQPBH8JxadmENUkUYep/deploy-hooks', {
    method: 'POST', headers: VH,
    body: JSON.stringify({ name: 'github-push', ref: 'main' })
  })
  const hook = await hookRes.json()
  
  if (!hook.url && !hook.hook?.url) {
    console.log('Réponse hook:', JSON.stringify(hook).slice(0,300))
    process.exit(1)
  }
  
  const hookUrl = hook.url || hook.hook?.url
  console.log('✅ Deploy Hook créé:', hookUrl.slice(0,60) + '...')

  // 2. Créer le webhook GitHub qui appelle ce hook à chaque push sur main
  console.log('🔗 Création du webhook GitHub...')
  const webhookRes = await fetch('https://api.github.com/repos/Zoukari/adorea/hooks', {
    method: 'POST', headers: GH,
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: ['push'],
      config: { url: hookUrl, content_type: 'json' }
    })
  })
  const webhook = await webhookRes.json()
  
  if (webhook.id) {
    console.log('✅ Webhook GitHub créé (ID:', webhook.id + ')')
    console.log('\n🎉 Maintenant chaque git push déclenche Vercel automatiquement!')
  } else {
    console.log('Réponse webhook:', JSON.stringify(webhook).slice(0,300))
  }
}

main().catch(console.error)
