import { supabase } from './supabaseClient'
import { uploadAvatar, deleteAvatar, uploadCoverImage, deleteCoverImageFromSupabase } from './mediaService'

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
        bio,
        location,
        website,
        birth_date,
        cover_image_url,
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

// Actualizar perfil de usuario - VERSIÓN SIMPLIFICADA SIN DELAYS
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
    if (updatedData.bio !== undefined) {
      updateFields.bio = updatedData.bio
    }
    if (updatedData.location !== undefined) {
      updateFields.location = updatedData.location
    }
    if (updatedData.website !== undefined) {
      updateFields.website = updatedData.website
    }
    if (updatedData.birth_date !== undefined) {
      updateFields.birth_date = updatedData.birth_date
    }
    if (updatedData.cover_image_url !== undefined) {
      updateFields.cover_image_url = updatedData.cover_image_url
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

// Actualizar perfil con avatar subido - VERSIÓN SIMPLIFICADA SIN DELAYS
export const updateUserProfileWithAvatar = async (userId, updatedData, avatarFile = null, coverFile = null) => {
  try {
    console.log('🔄 Actualizando perfil con archivos para usuario:', userId)
    console.log('📄 Avatar file:', avatarFile ? `${avatarFile.name} (${avatarFile.size} bytes)` : 'null')
    console.log('📄 Cover file:', coverFile ? `${coverFile.name} (${coverFile.size} bytes)` : 'null')
    
    let avatarUrl = updatedData.avatar_url // Mantener URL actual si no se sube nueva imagen
    let coverUrl = updatedData.cover_image_url // Mantener URL actual si no se sube nueva imagen
    
    // Obtener perfil actual para manejar URLs anteriores
    const currentProfile = await getUserProfile(userId)
    if (!currentProfile) {
      return { success: false, error: 'No se pudo obtener el perfil actual del usuario' }
    }

    const currentAvatarUrl = currentProfile.avatar_url
    const currentCoverUrl = currentProfile.cover_image_url
    
    // Solo proceder si hay archivos que subir
    if (!avatarFile && !coverFile) {
      console.log('📋 No hay archivos que subir, solo actualizando campos de texto')
      return await updateUserProfile(userId, updatedData)
    }
    
    // Subir avatar si existe
    if (avatarFile) {
      console.log('📸 Subiendo avatar...')
      
      const avatarResult = await uploadAvatar(avatarFile, userId)
      
      if (!avatarResult.success) {
        console.error('❌ Error subiendo avatar:', avatarResult.error)
        return { 
          success: false, 
          error: `Error al subir la imagen de perfil: ${avatarResult.error}` 
        }
      }
      
      avatarUrl = avatarResult.data.publicUrl
      console.log('✅ Avatar subido exitosamente:', avatarUrl)
      
      // Eliminar avatar anterior si existe (de forma no bloqueante)
      if (currentAvatarUrl && currentAvatarUrl !== avatarUrl) {
        deleteAvatar(currentAvatarUrl).catch(err => 
          console.warn('⚠️ Error eliminando avatar anterior:', err)
        )
      }
    }
    
    // Subir portada si existe
    if (coverFile) {
      console.log('🖼️ Subiendo imagen de portada...')
      
      const coverResult = await uploadCoverImage(coverFile, userId)
      
      if (!coverResult.success) {
        console.error('❌ Error subiendo imagen de portada:', coverResult.error)
        return { 
          success: false, 
          error: `Error al subir la imagen de portada: ${coverResult.error}` 
        }
      }
      
      coverUrl = coverResult.data.publicUrl
      console.log('✅ Imagen de portada subida exitosamente:', coverUrl)
      
      // Eliminar imagen de portada anterior si existe (de forma no bloqueante)
      if (currentCoverUrl && currentCoverUrl !== coverUrl) {
        deleteCoverImageFromSupabase(currentCoverUrl).catch(err => 
          console.warn('⚠️ Error eliminando imagen de portada anterior:', err)
        )
      }
    }
    
    // Preparar campos para actualizar en la base de datos
    const updateFields = {}
    
    if (updatedData.username !== undefined && updatedData.username.trim()) {
      updateFields.username = updatedData.username.trim()
    }
    if (updatedData.team !== undefined) {
      updateFields.team = updatedData.team
    }
    if (avatarUrl !== undefined && avatarUrl !== currentAvatarUrl) {
      updateFields.avatar_url = avatarUrl
    }
    if (coverUrl !== undefined && coverUrl !== currentCoverUrl) {
      updateFields.cover_image_url = coverUrl
    }
    if (updatedData.bio !== undefined) {
      updateFields.bio = updatedData.bio
    }
    if (updatedData.location !== undefined) {
      updateFields.location = updatedData.location
    }
    if (updatedData.website !== undefined) {
      updateFields.website = updatedData.website
    }
    if (updatedData.birth_date !== undefined) {
      updateFields.birth_date = updatedData.birth_date
    }
    
    // Solo actualizar si hay campos que cambiar
    if (Object.keys(updateFields).length === 0) {
      return { 
        success: true, 
        data: currentProfile,
        message: 'No hay cambios que aplicar'
      }
    }
    
    console.log('📋 Actualizando perfil en base de datos con campos:', updateFields)
    
    // Actualizar perfil en la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error actualizando perfil en base de datos:', error)
      return { 
        success: false, 
        error: `Error al actualizar el perfil: ${error.message}` 
      }
    }

    console.log('✅ Perfil actualizado exitosamente:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('💥 Error crítico en updateUserProfileWithAvatar:', error)
    return { success: false, error: error.message }
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

// Obtener posts de un usuario específico
export const getUserPosts = async (userId) => {
  try {
    console.log('🎯 getUserPosts en userService - usando sistema de likes')
    
    // Obtener posts del usuario directamente con contadores
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
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error obteniendo posts del usuario:', postsError)
      return []
    }

    if (!posts || posts.length === 0) {
      return []
    }

    const postIds = posts.map(post => post.id)

    // Obtener perfil del usuario y conteo de comentarios
    const [profileResult, commentsCountResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .eq('id', userId)
        .single(),
      
      // Contar comentarios por post
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .then(({ data }) => {
          const counts = {}
          data?.forEach(comment => {
            counts[comment.post_id] = (counts[comment.post_id] || 0) + 1
          })
          return counts
        })
    ])

    const { data: profile, error: profileError } = profileResult

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
    }

    // Combinar posts con perfil - USANDO CONTADORES DIRECTOS DE LIKES
    const postsWithData = posts.map(post => {
      const commentsCount = commentsCountResult[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0, // Usar contadores directos de la tabla posts
        is_liked: false // No rastreamos likes individuales en el perfil, solo contadores
      }
    })

    console.log('📊 Posts obtenidos con sistema de likes:', postsWithData)
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getUserPosts:', error)
    return []
  }
}

// Actualizar imagen de portada
export const updateCoverImage = async (userId, file, currentCoverUrl = null) => {
  try {
    let coverImageUrl = currentCoverUrl

    if (file) {
      // Subir nueva imagen de portada
      const uploadResult = await uploadCoverImage(file, userId)
      if (!uploadResult.success) {
        return uploadResult
      }
      coverImageUrl = uploadResult.data.publicUrl
    }

    // Actualizar URL en la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        cover_image_url: coverImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando imagen de portada en BD:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en updateCoverImage:', error)
    return { success: false, error: error.message }
  }
}

// Función para buscar usuarios
export const searchUsers = async (searchTerm, currentUserId) => {
  try {
    if (!searchTerm.trim()) {
      return []
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, team')
      .neq('id', currentUserId) // Excluir al usuario actual
      .or(`username.ilike.%${searchTerm}%,team.ilike.%${searchTerm}%`)
      .limit(8) // Limitar a 8 resultados

    if (error) {
      console.error('Error buscando usuarios:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error en searchUsers:', error)
    throw error
  }
}