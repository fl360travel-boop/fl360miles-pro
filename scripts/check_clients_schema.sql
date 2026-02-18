SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name IN ('user_id', 'email', 'organization_id');
