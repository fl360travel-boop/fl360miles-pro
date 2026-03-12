-- SCRIPT PARA CRIAR BUCKET DE BRANDING E POLÍTICAS DE ACESSO

-- 1. Criar o bucket 'branding' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa veja os logos (Público)
CREATE POLICY "branding_public_access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

-- 3. Permitir que usuários autenticados façam upload para sua própria pasta
CREATE POLICY "branding_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'branding' );

-- 4. Permitir que usuários autenticados deletem/atualizem seus próprios logos
CREATE POLICY "branding_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'branding' );

CREATE POLICY "branding_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'branding' );
