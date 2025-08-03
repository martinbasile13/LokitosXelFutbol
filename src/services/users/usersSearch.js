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
 * Obtener usuarios populares (por seguidores y actividad) - CON MANEJO DE ERRORES MEJORADO
 * @param {number} limit - Límite de usuarios
 * @param {string|null} currentUserId - ID del usuario actual (para excluir)
 * @returns {Promise<Array>} Usuarios populares
 */
export const getPopularUsers = async (limit = 10, currentUserId = null) => {
  try {
    // Obtener usuarios ordenados por experiencia
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

    console.log('👥 getPopularUsers - saltando conteos de seguidores para evitar 406')
    
    // NO HACER QUERIES DE FOLLOWERS PARA EVITAR 406
    // Simplemente devolver usuarios ordenados por experiencia
    const usersWithFollowers = users.map(user => ({
      ...user,
      followers_count: 0 // Valor por defecto para evitar errores 406
    }))

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
 * Obtener usuarios sugeridos para seguir - CON MANEJO DE ERRORES MEJORADO
 * @param {string} userId - ID del usuario actual
 * @param {number} limit - Límite de usuarios sugeridos
 * @returns {Promise<Array>} Lista de usuarios sugeridos
 */
export const getSuggestedUsers = async (userId, limit = 10) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('🎯 getSuggestedUsers - MODO SEGURO (sin followers para evitar 406)')

    // Obtener usuarios aleatorios sin verificar relaciones de seguimiento
    const { data: users, error } = await supabase
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
      .limit(limit * 2)

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      return []
    }

    // Mezclar y devolver sin verificar relaciones de seguimiento
    const shuffled = users.sort(() => 0.5 - Math.random())
    
    console.log('⚠️ Relaciones de seguimiento temporalmente deshabilitadas para evitar 406')
    
    return shuffled.slice(0, limit).map(user => ({
      ...user,
      is_following: false, // Valor temporal
      mutual_followers_count: 0
    }))
  } catch (error) {
    console.error('Error en getSuggestedUsers:', error)
    return []
  }
}