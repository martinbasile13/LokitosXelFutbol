// ===========================================
// USERS SEARCH - BÚSQUEDA Y DESCUBRIMIENTO DE USUARIOS
// ===========================================
// Responsabilidades:
// - Buscar usuarios por nombre/username
// - Obtener usuarios populares
// - Filtrar usuarios por equipo
// - Sugerir usuarios para seguir

import { supabase } from '../supabaseClient.js'

/**
 * Buscar usuarios por nombre de usuario o nombre completo
 * @param {string} query - Término de búsqueda
 * @param {number} limit - Límite de resultados
 * @param {string|null} currentUserId - ID del usuario actual (para excluir)
 * @returns {Promise<Array>} Usuarios encontrados
 */
export const searchUsers = async (query, limit = 20, currentUserId = null) => {
  try {
    if (!query || query.trim().length === 0) {
      return []
    }

    const searchTerm = query.trim().toLowerCase()

    let queryBuilder = supabase
      .from('profiles')
      .select(`
        id,
        username,
        handle,
        avatar_url,
        team,
        experience_points,
        bio
      `)
      .or(`username.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
      .order('experience_points', { ascending: false })
      .limit(limit)

    // Excluir usuario actual si está proporcionado
    if (currentUserId) {
      queryBuilder = queryBuilder.neq('id', currentUserId)
    }

    const { data, error } = await queryBuilder

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error en searchUsers:', error)
    return []
  }
}

/**
 * Obtener usuarios populares (por seguidores y actividad) - USANDO TABLA FOLLOWERS
 * @param {number} limit - Límite de usuarios
 * @param {string|null} currentUserId - ID del usuario actual (para excluir)
 * @returns {Promise<Array>} Usuarios populares
 */
export const getPopularUsers = async (limit = 10, currentUserId = null) => {
  try {
    // Obtener usuarios con más seguidores
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        handle,
        avatar_url,
        team,
        experience_points,
        bio
      `)
      .order('experience_points', { ascending: false })
      .limit(limit)

    // Excluir usuario actual
    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }

    const { data: users, error } = await query

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      return []
    }

    // Obtener conteos de seguidores para cada usuario - USANDO TABLA FOLLOWERS
    const userIds = users.map(user => user.id)
    
    const { data: followersData } = await supabase
      .from('followers')
      .select('following_id')
      .in('following_id', userIds)

    // Contar seguidores por usuario
    const followersCounts = {}
    followersData?.forEach(follow => {
      followersCounts[follow.following_id] = (followersCounts[follow.following_id] || 0) + 1
    })

    // Agregar conteo de seguidores a cada usuario
    const usersWithFollowers = users.map(user => ({
      ...user,
      followers_count: followersCounts[user.id] || 0
    }))

    // Ordenar por seguidores
    usersWithFollowers.sort((a, b) => b.followers_count - a.followers_count)

    return usersWithFollowers
  } catch (error) {
    console.error('Error en getPopularUsers:', error)
    return []
  }
}

/**
 * Obtener usuarios por equipo específico
 * @param {string} team - Nombre del equipo
 * @param {number} limit - Límite de usuarios
 * @param {string|null} currentUserId - ID del usuario actual (para excluir)
 * @returns {Promise<Array>} Usuarios del equipo
 */
export const getUsersByTeam = async (team, limit = 20, currentUserId = null) => {
  try {
    if (!team || team.trim().length === 0) {
      return []
    }

    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        handle,
        avatar_url,
        team,
        experience_points,
        bio
      `)
      .eq('team', team)
      .order('experience_points', { ascending: false })
      .limit(limit)

    // Excluir usuario actual
    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error en getUsersByTeam:', error)
    return []
  }
}

/**
 * Obtener usuarios sugeridos para seguir - USANDO TABLA FOLLOWERS
 * @param {string} userId - ID del usuario actual
 * @param {number} limit - Límite de usuarios sugeridos
 * @returns {Promise<Array>} Lista de usuarios sugeridos
 */
export const getSuggestedUsers = async (userId, limit = 10) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('🎯 getSuggestedUsers usando tabla followers real')

    // Obtener IDs de usuarios que ya sigue
    const { data: following } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId)

    const followingIds = following?.map(f => f.following_id) || []
    
    // Obtener usuarios que no sigue (excluyendo a sí mismo)
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        handle,
        avatar_url,
        team,
        experience_points,
        bio
      `)
      .neq('id', userId)
      .order('experience_points', { ascending: false })
      .limit(limit * 2) // Obtener más para poder filtrar

    // Excluir usuarios que ya sigue
    if (followingIds.length > 0) {
      query = query.not('id', 'in', `(${followingIds.join(',')})`)
    }

    const { data: users, error } = await query

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      return []
    }

    // Mezclar aleatoriamente y tomar solo el límite necesario
    const shuffled = users.sort(() => 0.5 - Math.random())
    
    return shuffled.slice(0, limit).map(user => ({
      ...user,
      is_following: false,
      mutual_followers_count: 0 // Podríamos implementar esto después
    }))
  } catch (error) {
    console.error('Error en getSuggestedUsers:', error)
    return []
  }
}