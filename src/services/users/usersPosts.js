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
 * Obtener posts recomendados basados en la actividad del usuario - USANDO TABLA FOLLOWERS
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de posts recomendados
 * @returns {Promise<Array>} Posts recomendados
 */
export const getRecommendedPosts = async (userId, limit = 10) => {
  try {
    if (!userId) {
      return []
    }

    console.log('🎯 getRecommendedPosts - obteniendo posts recomendados usando tabla followers')

    // Obtener usuarios que sigue - USANDO TABLA FOLLOWERS
    const { data: following } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId)

    const followedIds = following?.map(f => f.following_id) || []

    if (followedIds.length === 0) {
      // Si no sigue a nadie, mostrar posts populares
      const { data: popularPosts } = await supabase
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
        .order('likes_count', { ascending: false })
        .limit(limit)

      return await getPostsWithUserData(popularPosts || [], userId)
    }

    // Obtener posts recientes de usuarios seguidos
    const { data: recommendedPosts, error } = await supabase
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
      .in('user_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error obteniendo posts recomendados:', error)
      return []
    }

    if (!recommendedPosts || recommendedPosts.length === 0) {
      return []
    }

    // Enriquecer con datos adicionales
    const postsWithData = await getPostsWithUserData(recommendedPosts, userId)

    console.log('📊 Posts recomendados obtenidos:', postsWithData.length)
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