-- ====================================================================
-- CONFIGURAÇÃO DO WEBHOOK DE BEM-VINDO (WELCOME EMAIL)
-- ====================================================================

/**
 * INSTRUÇÕES:
 * 
 * 1. O Supabase não permite criar webhooks HTTP via SQL puro facilmente (requer extensão net).
 * 2. A forma mais recomendada é via Dashboard do Supabase:
 *    
 *    a) Vá em Database > Webhooks
 *    b) Clique em "Create a new webhook"
 *    c) Name: "send_welcome_email"
 *    d) Table: "subscriptions"
 *    e) Events: "Insert"
 *    f) Type: "HTTP Request"
 *    g) Method: "POST"
 *    h) URL: "https://fl360miles.netlify.app/api/send-email" (ou sua URL do Netlify)
 *    i) Headers: 
 *       - Content-Type: application/json
 *    j) Payload (Custom payload format):
 *       Use o template abaixo para mapear os dados corretamente:
 */

{
  "to": "(SELECT email FROM user_profiles UP JOIN organization_members OM ON UP.user_id = OM.user_id WHERE OM.organization_id = {{ record.organization_id }} AND OM.role = 'owner' LIMIT 1)",
  "subject": "Bem-vindo ao Flight 360 Miles!",
  "template": "welcome",
  "props": {
    "userName": "(SELECT split_part(display_name, ' ', 1) FROM user_profiles UP JOIN organization_members OM ON UP.user_id = OM.user_id WHERE OM.organization_id = {{ record.organization_id }} AND OM.role = 'owner' LIMIT 1)"
  }
}

/**
 * NOTA: Como o payload custom do Supabase é limitado para sub-queries complexas,
 * se preferir algo mais robusto, podemos criar uma função Edge no Supabase 
 * ou disparar direto do Netlify no momento da criação da assinatura.
 * 
 * ATUALMENTE: A assinatura trial é criada via Trigger SQL `handle_new_organization_subscription`.
 */

 -- Se quiser disparar via SQL (requer pg_net habilitado):
 /*
 SELECT net.http_post(
    url := 'https://fl360miles.netlify.app/api/send-email',
    body := jsonb_build_object(
        'to', (SELECT email FROM user_profiles UP JOIN organization_members OM ON UP.user_id = OM.user_id WHERE OM.organization_id = NEW.organization_id AND OM.role = 'owner' LIMIT 1),
        'subject', 'Bem-vindo ao Flight 360 Miles!',
        'template', 'welcome',
        'props', jsonb_build_object('userName', 'Cliente')
    )
 );
 */
