// ===========================================
// USERS RELATIONSHIPS - SEGUIR/DEJAR DE SEGUIR USUARIOS
// ===========================================
// Responsabilidades:
// - Seguir y dejar de seguir usuarios
// - Verificar relaciones de seguimiento
// - Obtener listas de seguidores y seguidos

import { supabase } from '../supabaseClient.js'

/**
 * Seguir a un usuario - USANDO TABLA FOLLOWERS
 * @param {string} followerId - ID del usuario que sigue
 * @param {string} followedId - ID del usuario a seguir
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const followUser = async (followerId, followedId) => {
  try {
    if (!followerId || !followedId) {
      return { success: false, error: 'followerId y followedId son requeridos' }
    }

    if (followerId === followedId) {
      return { success: false, error: 'No puedes seguirte a ti mismo' }
    }

    // Verificar si ya lo sigue
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followedId)
      .single()

    if (existingFollow) {
      return { success: false, error: 'Ya sigues a este usuario' }
    }

    // Crear relación de seguimiento
    const { data, error } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: followedId
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en followUser:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Dejar de seguir a un usuario - USANDO TABLA FOLLOWERS
 * @param {string} followerId - ID del usuario que deja de seguir
 * @param {string} followedId - ID del usuario a dejar de seguir
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const unfollowUser = async (followerId, followedId) => {
  try {
    if (!followerId || !followedId) {
      return { success: false, error: 'followerId y followedId son requeridos' }
    }

    // Eliminar relación de seguimiento
    const { data, error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followedId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en unfollowUser:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verificar si un usuario sigue a otro - USANDO TABLA FOLLOWERS
 * @param {string} followerId - ID del usuario que podría estar siguiendo
 * @param {string} followedId - ID del usuario que podría estar siendo seguido
 * @returns {Promise<boolean>} True si lo sigue, false si no
 */
export const isFollowing = async (followerId, followedId) => {
  try {
    if (!followerId || !followedId) {
      return false
    }

    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followedId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error verificando seguimiento:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error en isFollowing:', error)
    return false
  }
}

/**
 * Obtener lista de seguidores de un usuario - USANDO TABLA FOLLOWERS
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Offset para paginación
 * @returns {Promise<Array>} Lista de seguidores
 */
export const getUserFollowers = async (userId, limit = 20, offset = 0) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    const { data: follows, error } = await supabase
      .from('followers')
      .select(`
        follower_id,
        created_at,
        follower:follower_id (
          id,
          username,
          avatar_url,
          team,
          experience_points
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Transformar datos para que sea más fácil de usar
    const followers = follows?.map(follow => ({
      ...follow.follower,
      followed_at: follow.created_at
    })) || []

    return followers
  } catch (error) {
    console.error('Error en getUserFollowers:', error)
    return []
  }
}

/**
 * Obtener lista de usuarios que sigue un usuario - USANDO TABLA FOLLOWERS
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Offset para paginación
 * @returns {Promise<Array>} Lista de usuarios seguidos
 */
export const getUserFollowing = async (userId, limit = 20, offset = 0) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    const { data: follows, error } = await supabase
      .from('followers')
      .select(`
        following_id,
        created_at,
        following:following_id (
          id,
          username,
          avatar_url,
          team,
          experience_points
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Transformar datos para que sea más fácil de usar
    const following = follows?.map(follow => ({
      ...follow.following,
      followed_at: follow.created_at
    })) || []

    return following
  } catch (error) {
    console.error('Error en getUserFollowing:', error)
    return []
  }
}