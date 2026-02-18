SELECT 
    table_name, 
    column_name, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'economy_history';

SELECT * FROM pg_policies WHERE tablename = 'economy_history';
