// ===========================================
// MENTIONS SERVICE - GESTIÓN DE MENCIONES
// ===========================================
// Responsabilidades:
// - Detectar menciones en texto (@username)
// - Buscar usuarios para autocompletado
// - Crear notificaciones para usuarios mencionados

import { supabase } from './supabaseClient.js'

/**
 * Extraer menciones de un texto
 * @param {string} text - Texto a analizar
 * @returns {Array} Array de usernames mencionados (sin @)
 */
export const extractMentions = (text) => {
  if (!text) return []
  
  // Regex para detectar @username (letras, números, guiones y guiones bajos)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions = []
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1].toLowerCase()
    if (!mentions.includes(username)) {
      mentions.push(username)
    }
  }
  
  return mentions
}

/**
 * Buscar usuarios por username para autocompletado
 * @param {string} query - Texto de búsqueda
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Usuarios encontrados
 */
export const searchUsersForMention = async (query, limit = 10) => {
  try {
    if (!query || query.length < 2) return []
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, handle, avatar_url, team')
      .or(`username.ilike.%${query}%,handle.ilike.%${query}%`)
      .limit(limit)
    
    if (error) {
      console.error('Error buscando usuarios:', error)
      return []
    }
    
    return users || []
  } catch (error) {
    console.error('Error en searchUsersForMention:', error)
    return []
  }
}

/**
 * Verificar que los usuarios mencionados existen
 * @param {Array} mentions - Array de usernames
 * @returns {Promise<Array>} Usuarios válidos encontrados
 */
export const validateMentions = async (mentions) => {
  try {
    if (!mentions || mentions.length === 0) return []
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, handle')
      .or(`username.in.(${mentions.join(',')}),handle.in.(${mentions.join(',')})`)
    
    if (error) {
      console.error('Error validando menciones:', error)
      return []
    }
    
    return users || []
  } catch (error) {
    console.error('Error en validateMentions:', error)
    return []
  }
}

/**
 * Crear notificaciones para usuarios mencionados
 * @param {Array} mentionedUsers - Usuarios mencionados
 * @param {string} postId - ID del post
 * @param {string} authorId - ID del autor del post
 * @param {string} content - Contenido del post (truncado)
 * @returns {Promise<boolean>} Éxito de la operación
 */
export const createMentionNotifications = async (mentionedUsers, postId, authorId, content) => {
  try {
    if (!mentionedUsers || mentionedUsers.length === 0) return true
    
    // No crear notificación si el autor se menciona a sí mismo
    const validUsers = mentionedUsers.filter(user => user.id !== authorId)
    if (validUsers.length === 0) return true
    
    const notifications = validUsers.map(user => ({
      user_id: user.id,
      type: 'mention',
      post_id: postId,
      from_user_id: authorId,
      message: `Te mencionó en un post: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
    }))
    
    const { error } = await supabase
      .from('notifications')
      .insert(notifications)
    
    if (error) {
      console.error('Error creando notificaciones de mención:', error)
      return false
    }
    
    console.log(`✅ ${notifications.length} notificaciones de mención creadas`)
    return true
  } catch (error) {
    console.error('Error en createMentionNotifications:', error)
    return false
  }
}

/**
 * Procesar menciones en un post después de crearlo
 * @param {string} postId - ID del post
 * @param {string} content - Contenido del post
 * @param {string} authorId - ID del autor
 * @returns {Promise<boolean>} Éxito de la operación
 */
export const processMentionsInPost = async (postId, content, authorId) => {
  try {
    console.log('🔍 Procesando menciones en post:', postId)
    
    // 1. Extraer menciones del contenido
    const mentions = extractMentions(content)
    if (mentions.length === 0) {
      console.log('📝 No se encontraron menciones')
      return true
    }
    
    console.log('👥 Menciones encontradas:', mentions)
    
    // 2. Validar que los usuarios existen
    const validUsers = await validateMentions(mentions)
    if (validUsers.length === 0) {
      console.log('⚠️ No se encontraron usuarios válidos para las menciones')
      return true
    }
    
    console.log('✅ Usuarios válidos encontrados:', validUsers.map(u => u.username))
    
    // 3. Crear notificaciones
    const success = await createMentionNotifications(validUsers, postId, authorId, content)
    
    return success
  } catch (error) {
    console.error('Error procesando menciones:', error)
    return false
  }
}