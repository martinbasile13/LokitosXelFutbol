// ===========================================
// USERS STATS - ESTADÍSTICAS Y MÉTRICAS DE USUARIOS
// ===========================================
// Responsabilidades:
// - Obtener estadísticas de usuarios
// - Calcular métricas de actividad
// - Rankings y posiciones

import { supabase } from '../supabaseClient.js'

/**
 * Obtener estadísticas completas de un usuario - USANDO TABLA FOLLOWERS
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export const getUserStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Obtener estadísticas en paralelo
    const [postsResult, followersResult, followingResult] = await Promise.all([
      // Contar posts del usuario
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Contar seguidores - USANDO TABLA FOLLOWERS
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      
      // Contar seguidos - USANDO TABLA FOLLOWERS
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ])

    const postsCount = postsResult.count || 0
    const followersCount = followersResult.count || 0
    const followingCount = followingResult.count || 0

    // Obtener total de vistas y likes de posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('views_count, likes_count')
      .eq('user_id', userId)

    const totalViews = postsData?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0
    const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0

    console.log('📊 getUserStats usando tabla followers correcta')
    
    return {
      posts: postsCount,              // Cambiado de posts_count a posts
      followers: followersCount,      // Cambiado de followers_count a followers
      following: followingCount,      // Cambiado de following_count a following
      total_likes: totalLikes,
      total_views: totalViews
    }
  } catch (error) {
    console.error('Error en getUserStats:', error)
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