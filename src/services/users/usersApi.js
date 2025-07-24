// ===========================================
// USERS API - OPERACIONES CRUD DE PERFILES
// ===========================================
// Responsabilidades:
// - Obtener perfil de usuario
// - Crear perfil de usuario
// - Actualizar perfil básico
// - Actualizar perfil con archivos
// - Verificar existencia de perfil

import { supabase } from '../supabaseClient.js'
import { uploadAvatar, deleteAvatar, uploadCoverImage, deleteCoverImageFromSupabase } from '../mediaService.js'

/**
 * Obtener perfil completo de usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} Perfil del usuario o null si no existe
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

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

/**
 * Crear nuevo perfil de usuario
 * @param {string} userId - ID del usuario
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.username - Nombre de usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createUserProfile = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('Creando perfil para usuario:', userId, userData)
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: userData.username || `user_${userId.slice(0, 8)}`,
        experience_points: 0,
        team: 'Sin Equipo',
        avatar_url: null,
        bio: null,
        location: null,
        website: null,
        birth_date: null,
        cover_image_url: null
      })

    if (error) {
      console.error('Error creando perfil:', error)
      return { success: false, error: error.message }
    }

    console.log('Perfil creado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error en createUserProfile:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Actualizar perfil básico (sin archivos)
 * @param {string} userId - ID del usuario
 * @param {Object} updatedData - Datos a actualizar
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateUserProfile = async (userId, updatedData) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

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
    
    // Solo actualizar si hay campos que cambiar
    if (Object.keys(updateFields).length === 0) {
      const currentProfile = await getUserProfile(userId)
      return { 
        success: true, 
        data: currentProfile,
        message: 'No hay cambios que aplicar'
      }
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando perfil:', error)
      return { success: false, error: error.message }
    }

    console.log('Perfil actualizado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error en updateUserProfile:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Actualizar perfil con archivos (avatar y/o portada)
 * @param {string} userId - ID del usuario
 * @param {Object} updatedData - Datos a actualizar
 * @param {File|null} avatarFile - Archivo de avatar (opcional)
 * @param {File|null} coverFile - Archivo de portada (opcional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateUserProfileWithAvatar = async (userId, updatedData, avatarFile = null, coverFile = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('🔄 Actualizando perfil con archivos para usuario:', userId)
    console.log('📄 Avatar file:', avatarFile ? `${avatarFile.name} (${avatarFile.size} bytes)` : 'null')
    console.log('📄 Cover file:', coverFile ? `${coverFile.name} (${coverFile.size} bytes)` : 'null')
    
    let avatarUrl = updatedData.avatar_url
    let coverUrl = updatedData.cover_image_url
    
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

/**
 * Verificar si existe perfil de usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} True si existe, false si no
 */
export const checkUserProfile = async (userId) => {
  try {
    if (!userId) {
      return false
    }

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