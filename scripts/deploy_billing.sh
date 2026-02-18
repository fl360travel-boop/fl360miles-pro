#!/bin/bash

# Verificar se Supabase CLI está instalada
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI não encontrada."
    echo "   Por favor, instale com: brew install supabase/tap/supabase"
    exit 1
fi

echo "🚀 Iniciando deploy da função create-subscription..."

# Fazer login se necessário
# supabase login

# Deploy da função
supabase functions deploy create-subscription --no-verify-jwt

echo "✅ Deploy concluído!"
echo "⚠️  Não esqueça de configurar as variáveis no dashboard:"
echo "   - ASAAS_API_KEY: (Sua chave da API Asaas)"
echo "   - ASAAS_ENV: 'sandbox' ou 'production'"
