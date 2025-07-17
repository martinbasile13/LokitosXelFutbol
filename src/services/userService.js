import { supabase } from './supabaseClient'
import { uploadAvatar, deleteAvatar } from './mediaService'

// Obtener usuarios sugeridos (excluye el usuario actual y los que ya sigue)
export const getSuggestedUsers = async (currentUserId, limit = 5) => {
  try {
    // Primero obtener IDs de usuarios que ya sigue
    const { data: followingData, error: followingError } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', currentUserId)

    if (followingError) {
      console.error('Error obteniendo usuarios seguidos:', followingError)
    }

    const followingIds = followingData?.map(f => f.following_id) || []
    console.log('Usuarios que ya sigue:', followingIds)

    // Obtener usuarios que NO sigue (incluyendo el usuario actual)
    const excludeIds = [currentUserId, ...followingIds]
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        experience_points,
        team,
        avatar_url,
        created_at
      `)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(limit * 2) // Pedir más para compensar los filtrados

    if (error) {
      console.error('Error obteniendo usuarios sugeridos:', error)
      return []
    }

    // Tomar solo el límite solicitado
    return (data || []).slice(0, limit)
  } catch (error) {
    console.error('Error en getSuggestedUsers:', error)
    return []
  }
}

// Seguir a un usuario
export const followUser = async (currentUserId, userToFollowId) => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .insert({
        follower_id: currentUserId,
        following_id: userToFollowId
      })

    if (error) {
      console.error('Error siguiendo usuario:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en followUser:', error)
    return { success: false, error }
  }
}

// Dejar de seguir a un usuario
export const unfollowUser = async (currentUserId, userToUnfollowId) => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userToUnfollowId)

    if (error) {
      console.error('Error dejando de seguir usuario:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en unfollowUser:', error)
    return { success: false, error }
  }
}

// Verificar si el usuario actual sigue a otro usuario
export const isFollowing = async (currentUserId, otherUserId) => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', otherUserId)
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

// Obtener estadísticas del usuario (posts, seguidores, siguiendo)
export const getUserStats = async (userId) => {
  try {
    const [postsResult, followersResult, followingResult] = await Promise.all([
      // Contar posts
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      
      // Contar seguidores
      supabase
        .from('followers')
        .select('id', { count: 'exact' })
        .eq('following_id', userId),
      
      // Contar siguiendo
      supabase
        .from('followers')
        .select('id', { count: 'exact' })
        .eq('follower_id', userId)
    ])

    return {
      posts: postsResult.count || 0,
      followers: followersResult.count || 0,
      following: followingResult.count || 0
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return { posts: 0, followers: 0, following: 0 }
  }
}

// Crear perfil de usuario
export const createUserProfile = async (userId, userData) => {
  try {
    console.log('Creando perfil para usuario:', userId, userData)
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: userData.username || `user_${userId.slice(0, 8)}`,
        experience_points: 0,
        team: 'Sin Equipo',
        avatar_url: null
      })

    if (error) {
      console.error('Error creando perfil:', error)
      return { success: false, error }
    }

    console.log('Perfil creado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error en createUserProfile:', error)
    return { success: false, error }
  }
}

// Obtener perfil de usuario
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        experience_points,
        team,
        avatar_url,
        created_at
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error obteniendo perfil:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error en getUserProfile:', error)
    return null
  }
}

// Actualizar perfil de usuario
export const updateUserProfile = async (userId, updatedData) => {
  try {
    console.log('Actualizando perfil para usuario:', userId, updatedData)
    
    // Crear objeto con solo los campos que se van a actualizar
    const updateFields = {}
    
    if (updatedData.username !== undefined) {
      updateFields.username = updatedData.username
    }
    if (updatedData.team !== undefined) {
      updateFields.team = updatedData.team
    }
    if (updatedData.avatar_url !== undefined) {
      updateFields.avatar_url = updatedData.avatar_url
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando perfil:', error)
      return { success: false, error }
    }

    console.log('Perfil actualizado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error en updateUserProfile:', error)
    return { success: false, error }
  }
}

// Actualizar perfil con avatar subido
export const updateUserProfileWithAvatar = async (userId, updatedData, avatarFile = null) => {
  try {
    console.log('Actualizando perfil con avatar para usuario:', userId)
    
    let avatarUrl = updatedData.avatar_url // Mantener URL actual si no se sube nueva imagen
    
    // Si hay un archivo de avatar, subirlo primero
    if (avatarFile) {
      console.log('Subiendo nuevo avatar...')
      
      // Obtener avatar actual para eliminarlo después
      const currentProfile = await getUserProfile(userId)
      const currentAvatarUrl = currentProfile?.avatar_url
      
      // Subir nueva imagen
      const uploadResult = await uploadAvatar(avatarFile, userId)
      
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error }
      }
      
      avatarUrl = uploadResult.data.publicUrl
      console.log('Avatar subido exitosamente:', avatarUrl)
      
      // Eliminar avatar anterior si existe (no bloqueamos si falla)
      if (currentAvatarUrl && currentAvatarUrl !== avatarUrl) {
        await deleteAvatar(currentAvatarUrl)
      }
    }
    
    // Actualizar perfil en la base de datos
    const updateFields = {}
    
    if (updatedData.username !== undefined) {
      updateFields.username = updatedData.username
    }
    if (updatedData.team !== undefined) {
      updateFields.team = updatedData.team
    }
    if (avatarUrl !== undefined) {
      updateFields.avatar_url = avatarUrl
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando perfil:', error)
      return { success: false, error }
    }

    console.log('Perfil actualizado exitosamente:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('Error en updateUserProfileWithAvatar:', error)
    return { success: false, error }
  }
}

// Verificar si existe perfil de usuario
export const checkUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error verificando perfil:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error en checkUserProfile:', error)
    return false
  }
} 