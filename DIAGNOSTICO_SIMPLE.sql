-- DIAGNÓSTICO SIMPLE PASO A PASO
-- Ejecutar UNA LÍNEA A LA VEZ en Supabase SQL Editor

-- PASO 1: Test básico
SELECT 'Conexión funcionando' as test;

-- PASO 2: ¿Existen las tablas?
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- PASO 3: ¿Hay datos en profiles?
SELECT COUNT(*) as total_profiles FROM profiles;

-- PASO 4: ¿Qué perfiles tenemos?
SELECT id, username, avatar_url FROM profiles LIMIT 3;

-- PASO 5: ¿Hay storage buckets?
SELECT name, public FROM storage.buckets; 