// ===========================================
// NOTIFICATION SERVICE - GESTIÓN DE NOTIFICACIONES (SIMPLIFICADO)
// ===========================================
// Este archivo contiene solo las funciones esenciales de notificaciones

import { supabase } from './supabaseClient'

// ===================================
// OBTENER NOTIFICACIONES
// ===================================

export const getNotifications = async (userId, type = 'all', limit = 20) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        target_id,
        data,
        read,
        created_at,
        actor:actor_id (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error obteniendo notificaciones:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('💥 Error en getNotifications:', error)
    throw error
  }
}

export const getUnreadCount = async (userId) => {
  try {
    if (!userId) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('❌ Error obteniendo conteo no leídas:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('💥 Error en getUnreadCount:', error)
    return 0
  }
}

// ===================================
// MARCAR COMO LEÍDAS
// ===================================

export const markAsRead = async (notificationId) => {
  try {
    if (!notificationId) {
      return { success: false, error: 'notificationId es requerido' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const markAllAsRead = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'userId es requerido' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===================================
// CREAR NOTIFICACIONES
// ===================================

export const createFollowNotification = async (userId, actorId) => {
  try {
    if (!userId || !actorId) {
      return { success: false, error: 'userId y actorId son requeridos' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'follow',
        actor_id: actorId,
        target_id: actorId,
        data: { message: 'Te empezó a seguir' }
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===================================
// UTILIDADES
// ===================================

export const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'ahora'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export const getNotificationText = (notification) => {
  const actorName = notification.actor?.username || 'Alguien'
  
  switch (notification.type) {
    case 'follow':
      return `${actorName} te empezó a seguir`
    case 'like':
      return `A ${actorName} le gustó tu post`
    case 'comment':
      return `${actorName} comentó tu post`
    case 'recommended_post':
      return `Nuevo post de ${actorName}`
    default:
      return notification.data?.message || 'Nueva notificación'
  }
}

export const getNotificationIcon = (type) => {
  switch (type) {
    case 'follow':
      return 'UserPlus'
    case 'like':
      return 'Heart'
    case 'comment':
      return 'MessageCircle'
    case 'recommended_post':
      return 'Star'
    default:
      return 'Bell'
  }
}