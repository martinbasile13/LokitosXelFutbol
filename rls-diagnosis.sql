-- =======================================================
-- SCRIPT SQL PARA REVISAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- =======================================================

-- 1. Ver el estado de RLS en todas las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS Deshabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Ver TODAS las políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Específicamente para la tabla POST_LIKES (problema principal)
SELECT 
    'post_likes' as tabla,
    policyname as politica,
    cmd as operacion,
    qual as condicion_using,
    with_check as condicion_check,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Lectura'
        WHEN cmd = 'INSERT' THEN '➕ Inserción'
        WHEN cmd = 'UPDATE' THEN '✏️ Actualización'
        WHEN cmd = 'DELETE' THEN '🗑️ Eliminación'
        WHEN cmd = 'ALL' THEN '🔄 Todas las operaciones'
        ELSE cmd
    END as tipo_operacion
FROM pg_policies 
WHERE tablename = 'post_likes'
ORDER BY cmd;

-- 4. Ver políticas específicas para otras tablas importantes
SELECT 
    tablename,
    policyname,
    cmd as operacion,
    qual as condicion
FROM pg_policies 
WHERE tablename IN ('posts', 'profiles', 'comments', 'post_views')
ORDER BY tablename, cmd;

-- 5. Verificar si existen índices en post_likes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'post_likes';

-- 6. Ver la estructura de la tabla post_likes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_likes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =======================================================
-- POLÍTICAS RLS RECOMENDADAS PARA POST_LIKES
-- (Ejecutar solo si faltan políticas)
-- =======================================================

-- Habilitar RLS en post_likes (si no está habilitado)
-- ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (leer likes/dislikes)
-- CREATE POLICY "Anyone can view likes" ON public.post_likes
-- FOR SELECT USING (true);

-- Política para INSERT (agregar likes/dislikes)
-- CREATE POLICY "Users can insert their own likes" ON public.post_likes
-- FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (cambiar like/dislike)
-- CREATE POLICY "Users can update their own likes" ON public.post_likes
-- FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Política para DELETE (remover likes/dislikes) - LA MÁS IMPORTANTE
-- CREATE POLICY "Users can delete their own likes" ON public.post_likes
-- FOR DELETE USING (auth.uid() = user_id);

-- =======================================================
-- DIAGNÓSTICO ADICIONAL
-- =======================================================

-- 7. Ver usuarios y roles
SELECT 
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Verificar datos de ejemplo en post_likes
SELECT 
    post_id,
    user_id,
    is_like,
    created_at
FROM public.post_likes 
ORDER BY created_at DESC 
LIMIT 10;

-- 9. Contar registros por operación
SELECT 
    'Total post_likes' as descripcion,
    COUNT(*) as cantidad
FROM public.post_likes

UNION ALL

SELECT 
    'Likes (true)' as descripcion,
    COUNT(*) as cantidad
FROM public.post_likes 
WHERE is_like = true

UNION ALL

SELECT 
    'Dislikes (false)' as descripcion,
    COUNT(*) as cantidad
FROM public.post_likes 
WHERE is_like = false;