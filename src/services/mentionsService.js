// ===========================================
// MENTIONS SERVICE - GESTIÓN DE MENCIONES
// ===========================================
// Responsabilidades:
// - Detectar menciones en texto (@username)
// - Buscar usuarios para autocompletado
// - Crear notificaciones para usuarios mencionados

import { supabase } from './supabaseClient.js'
import { createFollowNotification } from './notificationService.js'

/**
 * Función de diagnóstico para políticas RLS de notifications
 */
const diagnoseNotificationsRLS = async () => {
  console.log('🔍 DIAGNÓSTICO RLS - NOTIFICATIONS')
  
  try {
    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 Usuario autenticado:', { 
      id: user?.id, 
      email: user?.email, 
      error: authError?.message 
    })

    if (!user) {
      console.error('❌ Usuario no autenticado')
      return false
    }

    // Test 1: Verificar SELECT en notifications
    console.log('📖 Test SELECT notifications...')
    const { data: testRead, error: readError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (readError) {
      console.error('❌ Error SELECT:', readError)
    } else {
      console.log('✅ SELECT exitoso:', testRead?.length || 0, 'registros')
    }

    // Test 2: Intentar INSERT básico
    console.log('📝 Test INSERT notifications...')
    const testNotification = {
      user_id: user.id,
      type: 'test',
      actor_id: user.id,
      target_id: user.id,
      data: { message: 'Test notification' },
      read: false
    }

    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()

    if (insertError) {
      console.error('❌ Error INSERT:', insertError)
      return false
    } else {
      console.log('✅ INSERT exitoso:', insertData)
      
      // Limpiar el registro de prueba
      await supabase
        .from('notifications')
        .delete()
        .eq('id', insertData[0].id)
      
      return true
    }
  } catch (error) {
    console.error('💥 Error en diagnóstico:', error)
    return false
  }
}

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
 * Crear notificaciones para usuarios mencionados - VERSION DE PRUEBA DIRECTA
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
    
    console.log('📝 Preparando notificaciones para usuarios:', validUsers.map(u => u.username))
    
    // DEBUGGING: Probar primero con createFollowNotification para comparar
    console.log('🧪 PRUEBA: Intentando crear notificación de follow primero para comparar...')
    
    const testFollowResult = await createFollowNotification(authorId, authorId)
    console.log('🧪 Resultado test follow:', testFollowResult)
    
    if (!testFollowResult.success) {
      console.error('❌ CONFIRMADO: createFollowNotification también falla:', testFollowResult.error)
      console.error('❌ El problema es general con RLS, no específico de menciones')
      return false
    }
    
    console.log('✅ createFollowNotification funcionó, probando menciones...')
    
    // Crear notificaciones una por una usando EXACTAMENTE el mismo formato que createFollowNotification
    for (const user of validUsers) {
      console.log('🔍 Insertando mención usando formato de follow...')
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'mention',
          actor_id: authorId,
          target_id: postId,
          data: { message: `Te mencionó en un post: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`}
        })
        .select()
      
      if (error) {
        console.error('❌ Error creando notificación de mención:', error)
        console.error('❌ Comparar con createFollowNotification que SÍ funcionó')
        return false
      }
      
      console.log('✅ Notificación de mención creada exitosamente:', data)
    }
    
    console.log(`✅ ${validUsers.length} notificaciones de mención creadas`)
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