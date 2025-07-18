-- SCRIPT DE DIAGNÓSTICO COMPLETO DE SUPABASE
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR TABLAS Y ESTRUCTURA
SELECT 'VERIFICANDO TABLAS...' as status;

-- Verificar que existan todas las tablas necesarias
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'posts', 'comments', 'post_likes', 'post_views', 'post_votes', 'comment_votes')
ORDER BY table_name;

-- 2. VERIFICAR POLÍTICAS RLS
SELECT 'VERIFICANDO POLÍTICAS RLS...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'posts', 'comments', 'post_likes', 'post_views', 'post_votes', 'comment_votes')
ORDER BY tablename, cmd;

-- 3. VERIFICAR RLS HABILITADO
SELECT 'VERIFICANDO RLS HABILITADO...' as status;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'posts', 'comments', 'post_likes', 'post_views', 'post_votes', 'comment_votes')
ORDER BY tablename;

-- 4. VERIFICAR DATOS DE PROFILES
SELECT 'VERIFICANDO PROFILES...' as status;

SELECT 
    id,
    username,
    CASE 
        WHEN avatar_url IS NULL THEN 'SIN AVATAR'
        WHEN avatar_url LIKE '%supabase.co%' THEN 'AVATAR SUPABASE'
        ELSE 'AVATAR EXTERNO'
    END as avatar_type,
    avatar_url,
    team,
    experience_points,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. VERIFICAR STORAGE
SELECT 'VERIFICANDO STORAGE...' as status;

-- Verificar buckets de storage
SELECT 
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 6. VERIFICAR ARCHIVOS EN STORAGE (si hay bucket avatars)
SELECT 'VERIFICANDO ARCHIVOS AVATARS...' as status;

SELECT 
    name as file_name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    metadata->>'size' as file_size,
    metadata->>'mimetype' as mime_type
FROM storage.objects 
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC 
LIMIT 10;

-- 7. VERIFICAR POSTS Y RELACIONES
SELECT 'VERIFICANDO POSTS...' as status;

SELECT 
    p.id,
    p.content,
    p.user_id,
    pr.username,
    pr.avatar_url,
    p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC 
LIMIT 5;

-- 8. VERIFICAR FOREIGN KEYS
SELECT 'VERIFICANDO FOREIGN KEYS...' as status;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('posts', 'comments', 'post_likes', 'post_views', 'post_votes', 'comment_votes')
ORDER BY tc.table_name;

-- 9. TEST DE PERMISOS BÁSICOS
SELECT 'TESTEANDO PERMISOS...' as status;

-- Test: ¿Puede leer profiles?
SELECT 'TEST READ PROFILES' as test, COUNT(*) as count FROM profiles;

-- Test: ¿Puede leer posts?
SELECT 'TEST READ POSTS' as test, COUNT(*) as count FROM posts;

-- 10. VERIFICAR USUARIOS AUTH
SELECT 'VERIFICANDO USUARIOS AUTH...' as status;

SELECT 
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'DIAGNÓSTICO COMPLETO ✅' as status; 