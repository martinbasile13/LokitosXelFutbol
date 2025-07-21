import { supabase } from './supabaseClient'

// ===================================
// OBTENER NOTIFICACIONES
// ===================================

// Obtener todas las notificaciones del usuario
export const getNotifications = async (userId, type = 'all', limit = 20) => {
  try {
    console.log('🔔 getNotifications:', { userId, type, limit })

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

    // Filtrar por tipo si se especifica
    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error obteniendo notificaciones:', error)
      throw error
    }

    console.log('✅ Notificaciones obtenidas:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('💥 Error en getNotifications:', error)
    throw error
  }
}

// Obtener nuevos seguidores recientes
export const getNewFollowers = async (userId, limit = 10) => {
  try {
    console.log('👥 getNewFollowers:', { userId, limit })

    const { data, error } = await supabase
      .from('followers')
      .select(`
        id,
        created_at,
        follower:follower_id (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error obteniendo nuevos seguidores:', error)
      throw error
    }

    console.log('✅ Nuevos seguidores obtenidos:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('💥 Error en getNewFollowers:', error)
    throw error
  }
}

// Obtener likes recientes en posts del usuario
export const getRecentLikes = async (userId, limit = 10) => {
  try {
    console.log('❤️ getRecentLikes:', { userId, limit })

    const { data, error } = await supabase
      .from('post_likes')
      .select(`
        id,
        created_at,
        post:post_id (
          id,
          content,
          user_id
        ),
        user:user_id (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .eq('post.user_id', userId)
      .neq('user_id', userId) // Excluir likes propios
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error obteniendo likes recientes:', error)
      throw error
    }

    console.log('✅ Likes recientes obtenidos:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('💥 Error en getRecentLikes:', error)
    throw error
  }
}

// Obtener comentarios recientes en posts del usuario
export const getRecentComments = async (userId, limit = 10) => {
  try {
    console.log('💬 getRecentComments:', { userId, limit })

    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        post:post_id (
          id,
          content,
          user_id
        ),
        user:user_id (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .eq('post.user_id', userId)
      .neq('user_id', userId) // Excluir comentarios propios
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error obteniendo comentarios recientes:', error)
      throw error
    }

    console.log('✅ Comentarios recientes obtenidos:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('💥 Error en getRecentComments:', error)
    throw error
  }
}

// Obtener posts recomendados de usuarios que sigue
export const getRecommendedPosts = async (userId, limit = 5) => {
  try {
    console.log('⭐ getRecommendedPosts:', { userId, limit })

    // Obtener posts de usuarios que sigue
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        created_at,
        likes_count,
        views_count,
        user:user_id (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .in('user_id', 
        supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId)
      )
      .neq('user_id', userId) // Excluir posts propios
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error obteniendo posts recomendados:', error)
      throw error
    }

    console.log('✅ Posts recomendados obtenidos:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('💥 Error en getRecommendedPosts:', error)
    throw error
  }
}

// ===================================
// MARCAR COMO LEÍDAS
// ===================================

// Marcar notificación como leída
export const markAsRead = async (notificationId) => {
  try {
    console.log('📖 markAsRead:', notificationId)

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()

    if (error) {
      console.error('❌ Error marcando notificación como leída:', error)
      throw error
    }

    console.log('✅ Notificación marcada como leída')
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en markAsRead:', error)
    return { success: false, error }
  }
}

// Marcar todas las notificaciones como leídas
export const markAllAsRead = async (userId) => {
  try {
    console.log('📖 markAllAsRead:', userId)

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('❌ Error marcando todas las notificaciones como leídas:', error)
      throw error
    }

    console.log('✅ Todas las notificaciones marcadas como leídas')
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en markAllAsRead:', error)
    return { success: false, error }
  }
}

// Obtener conteo de notificaciones no leídas
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('❌ Error obteniendo conteo no leídas:', error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('💥 Error en getUnreadCount:', error)
    return 0
  }
}

// ===================================
// CREAR NOTIFICACIONES MANUALES
// ===================================

// Crear notificación manual de post recomendado
export const createRecommendedPostNotification = async (userId, postId, actorId) => {
  try {
    console.log('⭐ createRecommendedPostNotification:', { userId, postId, actorId })

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'recommended_post',
        actor_id: actorId,
        target_id: postId,
        data: {
          message: 'Nuevo post recomendado'
        }
      })
      .select()

    if (error) {
      console.error('❌ Error creando notificación de post recomendado:', error)
      throw error
    }

    console.log('✅ Notificación de post recomendado creada')
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en createRecommendedPostNotification:', error)
    return { success: false, error }
  }
}

// ===================================
// UTILIDADES
// ===================================

// Formatear tiempo relativo para notificaciones
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

// Obtener texto descriptivo de la notificación
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

// Obtener icono de la notificación
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