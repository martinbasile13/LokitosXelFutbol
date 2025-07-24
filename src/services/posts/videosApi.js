// ===========================================
// VIDEOS API - FEED ESPECÍFICO DE VIDEOS
// ===========================================
// Responsabilidades:
// - Feed de videos (posts con video_url)
// - Obtener video por ID
// - Videos de un usuario específico

import { supabase } from '../supabaseClient.js'
import { getPostsWithUserData } from './postsFeed.js'

/**
 * Obtener feed de videos (solo posts con video_url)
 * @param {number} limit - Límite de videos
 * @param {number} offset - Offset para paginación
 * @param {string|null} startFromPostId - ID del post inicial (opcional)
 * @param {string|null} userId - ID del usuario actual
 * @returns {Promise<{success: boolean, posts?: Array, error?: string}>}
 */
export const getVideoFeed = async (limit = 20, offset = 0, startFromPostId = null, userId = null) => {
  try {
    let query = supabase
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
      .not('video_url', 'is', null) // Solo posts con video
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Si se especifica un post inicial, obtener videos a partir de ahí
    if (startFromPostId) {
      // Primero obtener la fecha del post inicial
      const { data: startPost } = await supabase
        .from('posts')
        .select('created_at')
        .eq('id', startFromPostId)
        .single()

      if (startPost) {
        // Obtener videos desde ese post hacia atrás y hacia adelante
        query = supabase
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
          .not('video_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit)
      }
    }

    const { data: videos, error: videosError } = await query

    if (videosError) {
      return { success: false, error: videosError.message }
    }

    if (!videos || videos.length === 0) {
      return { success: true, posts: [] }
    }

    // Enriquecer videos con datos de usuarios e interacciones
    const videosWithData = await getPostsWithUserData(videos, userId)

    return { success: true, posts: videosWithData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Obtener un video específico por ID
 * @param {string} videoId - ID del video (post)
 * @param {string|null} userId - ID del usuario actual
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getVideoById = async (videoId, userId = null) => {
  try {
    if (!videoId) {
      throw new Error('videoId es requerido')
    }

    // Obtener el video básico
    const { data: video, error: videoError } = await supabase
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
      .eq('id', videoId)
      .not('video_url', 'is', null) // Asegurar que es un video
      .single()

    if (videoError) {
      throw videoError
    }

    if (!video) {
      throw new Error('Video no encontrado')
    }

    // Enriquecer con datos adicionales
    const [videoWithData] = await getPostsWithUserData([video], userId)

    return { success: true, data: videoWithData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Obtener videos de un usuario específico
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de videos
 * @param {number} offset - Offset para paginación
 * @param {string|null} currentUserId - ID del usuario actual (para votos)
 * @returns {Promise<{success: boolean, posts?: Array, error?: string}>}
 */
export const getVideosByUser = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Obtener videos del usuario
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
      .not('video_url', 'is', null) // Solo posts con video
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (videosError) {
      return { success: false, error: videosError.message }
    }

    if (!videos || videos.length === 0) {
      return { success: true, posts: [] }
    }

    // Enriquecer videos con datos adicionales
    const videosWithData = await getPostsWithUserData(videos, currentUserId)

    return { success: true, posts: videosWithData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Obtener estadísticas de videos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserVideoStats = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Contar videos del usuario
    const { count: videosCount, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('video_url', 'is', null)

    if (countError) {
      throw countError
    }

    // Obtener total de vistas de videos
    const { data: viewsData, error: viewsError } = await supabase
      .from('posts')
      .select('views_count')
      .eq('user_id', userId)
      .not('video_url', 'is', null)

    if (viewsError) {
      console.warn('Error obteniendo vistas de videos:', viewsError)
    }

    const totalViews = viewsData?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0

    return {
      success: true,
      data: {
        total_videos: videosCount || 0,
        total_views: totalViews
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Obtener videos más populares (por vistas)
 * @param {number} limit - Límite de videos
 * @param {string|null} timeframe - Timeframe ('day', 'week', 'month', 'all')
 * @returns {Promise<{success: boolean, posts?: Array, error?: string}>}
 */
export const getTrendingVideos = async (limit = 10, timeframe = 'week') => {
  try {
    let query = supabase
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
      .not('video_url', 'is', null)
      .order('views_count', { ascending: false })
      .limit(limit)

    // Filtrar por timeframe si no es 'all'
    if (timeframe !== 'all') {
      const timeframes = {
        day: 1,
        week: 7,
        month: 30
      }
      
      const daysAgo = timeframes[timeframe] || 7
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo)
      
      query = query.gte('created_at', dateThreshold.toISOString())
    }

    const { data: videos, error: videosError } = await query

    if (videosError) {
      return { success: false, error: videosError.message }
    }

    if (!videos || videos.length === 0) {
      return { success: true, posts: [] }
    }

    // Enriquecer videos con datos adicionales
    const videosWithData = await getPostsWithUserData(videos)

    return { success: true, posts: videosWithData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}