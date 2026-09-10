#!/bin/bash
# ADORÉA — Script de déploiement Vercel
# Usage: bash deploy.sh VOTRE_VERCEL_TOKEN

VERCEL_TOKEN=${1:-""}

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Usage: bash deploy.sh <VERCEL_TOKEN>"
  echo ""
  echo "Pour obtenir un token Vercel:"
  echo "1. Allez sur https://vercel.com/account/tokens"
  echo "2. New Token → 'adorea-deploy'"
  echo "3. Copiez le token"
  exit 1
fi

echo "🚀 Déploiement ADORÉA sur Vercel..."

# Créer le projet Vercel si pas encore fait
PROJECT=$(curl -s -X POST "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "adorea",
    "framework": "nextjs",
    "gitRepository": {
      "type": "github",
      "repo": "Zoukari/adorea"
    }
  }')

PROJECT_ID=$(echo $PROJECT | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id', d.get('error',{}).get('message','')))" 2>/dev/null)
echo "Project: $PROJECT_ID"

# Configurer les variables d'environnement
ENV_VARS='[
  {
    "key": "NEXT_PUBLIC_SUPABASE_URL",
    "value": "https://dlqhlcaaedrrwhtcgzbz.supabase.co",
    "type": "plain",
    "target": ["production", "preview", "development"]
  },
  {
    "key": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjMyOTUsImV4cCI6MjEwNDYzOTI5NX0.XxSWinxbZGEQqGJBcXtRdAOQFZVjLrZBhciS0xayuE0",
    "type": "plain",
    "target": ["production", "preview", "development"]
  },
  {
    "key": "SUPABASE_SERVICE_ROLE_KEY",
    "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscWhsY2FhZWRyd2h0Y2d6YmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA2MzI5NSwiZXhwIjoyMTA0NjM5Mjk1fQ.MXK9oYfSG3coahvkYb81LDLhjG0hNrfDWQMK7c_ALnc",
    "type": "sensitive",
    "target": ["production", "preview"]
  },
  {
    "key": "NEXT_PUBLIC_WA_NUMBER",
    "value": "25377596159",
    "type": "plain",
    "target": ["production", "preview", "development"]
  },
  {
    "key": "NEXT_PUBLIC_SITE_URL",
    "value": "https://adorea-dj.com",
    "type": "plain",
    "target": ["production"]
  }
]'

if [ -n "$PROJECT_ID" ] && [ ${#PROJECT_ID} -gt 10 ]; then
  echo "✅ Ajout des variables d'environnement..."
  curl -s -X POST "https://api.vercel.com/v9/projects/$PROJECT_ID/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ENV_VARS" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ENV:', 'OK' if isinstance(d,list) else d.get('error',{}).get('message','done'))" 2>/dev/null

  echo "✅ Variables configurées!"
  echo ""
  echo "🌐 Ton site sera disponible sur:"
  echo "   https://adorea.vercel.app"
  echo ""
  echo "Pour ajouter le domaine adorea-dj.com:"
  echo "   https://vercel.com/Zoukari/adorea/settings/domains"
fi

echo "🎉 Deploy lancé! Suivi sur: https://vercel.com/Zoukari/adorea"
