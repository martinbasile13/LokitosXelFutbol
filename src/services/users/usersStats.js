// ===========================================
// USERS STATS - ESTADÍSTICAS Y MÉTRICAS DE USUARIOS
// ===========================================
// Responsabilidades:
// - Obtener estadísticas de usuarios
// - Calcular métricas de actividad
// - Rankings y posiciones

import { supabase } from '../supabaseClient.js'

/**
 * PASO 2: Obtener estadísticas de usuario CON CONTEOS DE FOLLOWERS
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export const getUserStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('📊 PASO 2: Probando getUserStats con conteos de followers...')

    // Obtener conteo de posts (sabemos que funciona)
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const postsCount = (!postsError && postsData) ? postsData.count || 0 : 0

    // PASO 2: Probar conteos de followers con timeout corto
    let followersCount = 0
    let followingCount = 0

    console.log('🔍 PASO 2: Probando conteo de seguidores...')
    try {
      const followersResult = await Promise.race([
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ])

      if (!followersResult.error) {
        followersCount = followersResult.count || 0
        console.log('✅ PASO 2: Conteo de seguidores exitoso:', followersCount)
      } else {
        console.warn('⚠️ PASO 2: Error en conteo de seguidores:', followersResult.error.message)
      }
    } catch (error) {
      console.warn('⚠️ PASO 2: Timeout/Error en seguidores:', error.message)
    }

    console.log('🔍 PASO 2: Probando conteo de siguiendo...')
    try {
      const followingResult = await Promise.race([
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ])

      if (!followingResult.error) {
        followingCount = followingResult.count || 0
        console.log('✅ PASO 2: Conteo de siguiendo exitoso:', followingCount)
      } else {
        console.warn('⚠️ PASO 2: Error en conteo de siguiendo:', followingResult.error.message)
      }
    } catch (error) {
      console.warn('⚠️ PASO 2: Timeout/Error en siguiendo:', error.message)
    }

    // Obtener total de vistas y likes de posts (esto funciona)
    let totalViews = 0
    let totalLikes = 0
    
    try {
      const { data: postsStatsData, error: postsStatsError } = await supabase
        .from('posts')
        .select('views_count, likes_count')
        .eq('user_id', userId)

      if (!postsStatsError && postsStatsData) {
        totalViews = postsStatsData.reduce((sum, post) => sum + (post.views_count || 0), 0)
        totalLikes = postsStatsData.reduce((sum, post) => sum + (post.likes_count || 0), 0)
      }
    } catch (postsStatsErr) {
      console.warn('⚠️ Error obteniendo datos de posts para estadísticas:', postsStatsErr)
    }

    const stats = {
      posts: postsCount,
      followers: followersCount,
      following: followingCount,
      total_likes: totalLikes,
      total_views: totalViews
    }

    console.log('✅ PASO 2: getUserStats completado:', stats)
    return stats

  } catch (error) {
    console.error('💥 Error crítico en getUserStats:', error)
    return {
      posts: 0,
      followers: 0,
      following: 0,
      total_likes: 0,
      total_views: 0
    }
  }
}

/**
 * Obtener actividad reciente del usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de actividades
 * @returns {Promise<Array>} Actividades recientes
 */
export const getUserActivity = async (userId, limit = 10) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Obtener posts recientes con estadísticas
    const { data: recentPosts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        views_count,
        likes_count,
        dislikes_count
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return recentPosts || []
  } catch (error) {
    console.error('Error en getUserActivity:', error)
    return []
  }
}

/**
 * Obtener ranking del usuario en diferentes categorías
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Rankings del usuario
 */
export const getUserRanking = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Obtener rankings usando funciones SQL
    const [postsRankResult, likesRankResult, followersRankResult] = await Promise.all([
      supabase.rpc('get_user_posts_rank', { p_user_id: userId }),
      supabase.rpc('get_user_likes_rank', { p_user_id: userId }),
      supabase.rpc('get_user_followers_rank', { p_user_id: userId })
    ])

    return {
      posts_rank: postsRankResult.data || null,
      likes_rank: likesRankResult.data || null,
      followers_rank: followersRankResult.data || null
    }
  } catch (error) {
    console.error('Error en getUserRanking:', error)
    return {
      posts_rank: null,
      likes_rank: null,
      followers_rank: null
    }
  }
}

/**
 * Obtener estadísticas completas de un usuario - CON MANEJO ROBUSTO DE ERRORES 406
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export const getUserStatsRobust = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('📊 getUserStats - MODO ROBUSTO con manejo de errores 406')

    // Obtener posts count (siempre debería funcionar)
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const postsCount = (!postsError && postsData) ? postsData.count || 0 : 0

    // Intentar obtener conteos de followers con manejo robusto de errores
    let followersCount = 0
    let followingCount = 0

    try {
      // Intento 1: Conteo de seguidores
      const followersResult = await Promise.race([
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ])

      if (!followersResult.error) {
        followersCount = followersResult.count || 0
        console.log('✅ Seguidores obtenidos:', followersCount)
      } else {
        console.warn('⚠️ Error 406 en seguidores, usando valor por defecto')
      }
    } catch (error) {
      console.warn('⚠️ Timeout o error en seguidores:', error.message)
    }

    try {
      // Intento 2: Conteo de siguiendo
      const followingResult = await Promise.race([
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ])

      if (!followingResult.error) {
        followingCount = followingResult.count || 0
        console.log('✅ Siguiendo obtenidos:', followingCount)
      } else {
        console.warn('⚠️ Error 406 en siguiendo, usando valor por defecto')
      }
    } catch (error) {
      console.warn('⚠️ Timeout o error en siguiendo:', error.message)
    }

    // Obtener total de vistas y likes de posts
    let totalViews = 0
    let totalLikes = 0
    
    try {
      const { data: postsStatsData, error: postsStatsError } = await supabase
        .from('posts')
        .select('views_count, likes_count')
        .eq('user_id', userId)

      if (!postsStatsError && postsStatsData) {
        totalViews = postsStatsData.reduce((sum, post) => sum + (post.views_count || 0), 0)
        totalLikes = postsStatsData.reduce((sum, post) => sum + (post.likes_count || 0), 0)
      }
    } catch (postsStatsErr) {
      console.warn('⚠️ Error obteniendo datos de posts para estadísticas:', postsStatsErr)
    }

    const stats = {
      posts: postsCount,
      followers: followersCount,
      following: followingCount,
      total_likes: totalLikes,
      total_views: totalViews
    }

    console.log('✅ getUserStats completado (modo robusto):', stats)
    return stats

  } catch (error) {
    console.error('💥 Error crítico en getUserStats:', error)
    return {
      posts: 0,
      followers: 0,
      following: 0,
      total_likes: 0,
      total_views: 0
    }
  }
}