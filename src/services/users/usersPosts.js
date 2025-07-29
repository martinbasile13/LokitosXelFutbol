// ===========================================
// USERS POSTS - GESTIÓN DE POSTS DE USUARIOS
// ===========================================
// Responsabilidades:
// - Obtener posts de un usuario específico
// - Obtener videos de un usuario
// - Contar posts de usuario
// - Posts recomendados basados en actividad

import { supabase } from '../supabaseClient.js'
import { getPostsWithUserData } from '../posts/postsFeed.js'

/**
 * Obtener posts de un usuario específico con datos completos
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de posts
 * @param {number} offset - Offset para paginación
 * @param {string|null} currentUserId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Posts del usuario con datos completos
 */
export const getUserPosts = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('🎯 getUserPosts - obteniendo posts del usuario:', userId)
    
    // Obtener posts del usuario
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error('Error obteniendo posts del usuario:', postsError)
      return []
    }

    if (!posts || posts.length === 0) {
      return []
    }

    // Enriquecer posts con datos de usuario e interacciones
    const postsWithData = await getPostsWithUserData(posts, currentUserId)

    console.log('📊 Posts del usuario obtenidos:', postsWithData.length)
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getUserPosts:', error)
    return []
  }
}

/**
 * Obtener solo videos de un usuario específico
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de videos
 * @param {number} offset - Offset para paginación
 * @param {string|null} currentUserId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Videos del usuario
 */
export const getUserVideos = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('🎬 getUserVideos - obteniendo videos del usuario:', userId)
    
    // Obtener solo posts con video_url
    const { data: videos, error: videosError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', userId)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (videosError) {
      console.error('Error obteniendo videos del usuario:', videosError)
      return []
    }

    if (!videos || videos.length === 0) {
      return []
    }

    // Enriquecer videos con datos adicionales
    const videosWithData = await getPostsWithUserData(videos, currentUserId)

    console.log('📊 Videos del usuario obtenidos:', videosWithData.length)
    return videosWithData
  } catch (error) {
    console.error('💥 Error en getUserVideos:', error)
    return []
  }
}

/**
 * Contar total de posts de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Número total de posts
 */
export const getUserPostsCount = async (userId) => {
  try {
    if (!userId) {
      return 0
    }

    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error contando posts del usuario:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error en getUserPostsCount:', error)
    return 0
  }
}

/**
 * Obtener posts recomendados basados en las visitas de los últimos 2 días
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de posts recomendados (por defecto 3)
 * @returns {Promise<Array>} Posts más visitados de los últimos 2 días
 */
export const getRecommendedPosts = async (userId, limit = 3) => {
  try {
    if (!userId) {
      return []
    }

    console.log('🎯 getRecommendedPosts - obteniendo posts más visitados de los últimos 2 días')

    // Calcular fecha de hace 2 días
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const twoDaysAgoISO = twoDaysAgo.toISOString()

    console.log('📅 Buscando posts desde:', twoDaysAgoISO)

    // Obtener posts de los últimos 2 días ordenados por visitas
    const { data: topViewedPosts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .gte('created_at', twoDaysAgoISO)
      .not('views_count', 'is', null)
      .order('views_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error obteniendo posts más visitados:', error)
      return []
    }

    if (!topViewedPosts || topViewedPosts.length === 0) {
      console.log('📊 No se encontraron posts con visitas en los últimos 2 días')
      
      // Fallback: obtener posts más visitados de la última semana
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const oneWeekAgoISO = oneWeekAgo.toISOString()

      const { data: fallbackPosts } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          image_url,
          video_url,
          views_count,
          likes_count,
          dislikes_count,
          created_at,
          updated_at,
          user_id
        `)
        .gte('created_at', oneWeekAgoISO)
        .not('views_count', 'is', null)
        .order('views_count', { ascending: false })
        .limit(limit)

      if (!fallbackPosts || fallbackPosts.length === 0) {
        return []
      }

      // Enriquecer con datos adicionales
      const postsWithData = await getPostsWithUserData(fallbackPosts, userId)
      console.log('📊 Posts recomendados (fallback última semana):', postsWithData.length)
      return postsWithData
    }

    // Enriquecer con datos adicionales
    const postsWithData = await getPostsWithUserData(topViewedPosts, userId)

    console.log('📊 Posts más visitados de los últimos 2 días:', postsWithData.length)
    console.log('👀 Visitas de posts encontrados:', postsWithData.map(p => p.views_count))
    
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getRecommendedPosts:', error)
    return []
  }
}

/**
 * Obtener posts más populares de un usuario (por likes)
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de posts
 * @returns {Promise<Array>} Posts más populares del usuario
 */
export const getUserTopPosts = async (userId, limit = 5) => {
  try {
    if (!userId) {
      return []
    }

    const { data: topPosts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', userId)
      .order('likes_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error obteniendo posts top del usuario:', error)
      return []
    }

    if (!topPosts || topPosts.length === 0) {
      return []
    }

    // Enriquecer con datos adicionales
    const postsWithData = await getPostsWithUserData(topPosts, userId)

    return postsWithData
  } catch (error) {
    console.error('Error en getUserTopPosts:', error)
    return []
  }
}