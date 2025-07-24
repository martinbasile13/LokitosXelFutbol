// ===========================================
// USERS MEDIA - MANEJO DE AVATARS Y PORTADAS
// ===========================================
// Responsabilidades:
// - Actualizar imagen de portada
// - Actualizar avatar
// - Eliminar archivos de usuario

import { supabase } from '../supabaseClient.js'
import { uploadAvatar, uploadCoverImage, deleteAvatar, deleteCoverImageFromSupabase } from '../mediaService.js'

/**
 * Actualizar imagen de portada del usuario
 * @param {string} userId - ID del usuario
 * @param {File} file - Archivo de imagen
 * @param {string|null} currentCoverUrl - URL actual de la portada (para eliminar)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateCoverImage = async (userId, file, currentCoverUrl = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    let coverImageUrl = currentCoverUrl

    if (file) {
      // Subir nueva imagen de portada
      const uploadResult = await uploadCoverImage(file, userId)
      if (!uploadResult.success) {
        return uploadResult
      }
      coverImageUrl = uploadResult.data.publicUrl

      // Eliminar imagen anterior si existe (de forma no bloqueante)
      if (currentCoverUrl && currentCoverUrl !== coverImageUrl) {
        deleteCoverImageFromSupabase(currentCoverUrl).catch(err => 
          console.warn('⚠️ Error eliminando imagen de portada anterior:', err)
        )
      }
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

/**
 * Actualizar avatar del usuario
 * @param {string} userId - ID del usuario
 * @param {File} file - Archivo de imagen
 * @param {string|null} currentAvatarUrl - URL actual del avatar (para eliminar)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateAvatarImage = async (userId, file, currentAvatarUrl = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    if (!file) {
      throw new Error('file es requerido')
    }

    // Subir nuevo avatar
    const uploadResult = await uploadAvatar(file, userId)
    if (!uploadResult.success) {
      return uploadResult
    }

    const avatarUrl = uploadResult.data.publicUrl

    // Eliminar avatar anterior si existe (de forma no bloqueante)
    if (currentAvatarUrl && currentAvatarUrl !== avatarUrl) {
      deleteAvatar(currentAvatarUrl).catch(err => 
        console.warn('⚠️ Error eliminando avatar anterior:', err)
      )
    }

    // Actualizar URL en la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando avatar en BD:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en updateAvatarImage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar avatar del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUserAvatar = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Obtener URL actual del avatar
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
      return { success: false, error: profileError.message }
    }

    // Eliminar archivo si existe
    if (profile.avatar_url) {
      await deleteAvatar(profile.avatar_url).catch(err => 
        console.warn('⚠️ Error eliminando archivo de avatar:', err)
      )
    }

    // Actualizar BD para remover URL
    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error removiendo avatar de BD:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error en deleteUserAvatar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar imagen de portada del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUserCoverImage = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Obtener URL actual de la portada
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cover_image_url')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
      return { success: false, error: profileError.message }
    }

    // Eliminar archivo si existe
    if (profile.cover_image_url) {
      await deleteCoverImageFromSupabase(profile.cover_image_url).catch(err => 
        console.warn('⚠️ Error eliminando archivo de portada:', err)
      )
    }

    // Actualizar BD para remover URL
    const { error } = await supabase
      .from('profiles')
      .update({ 
        cover_image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error removiendo portada de BD:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error en deleteUserCoverImage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar todos los archivos multimedia del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUserMedia = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    // Ejecutar eliminación de avatar y portada en paralelo
    const [avatarResult, coverResult] = await Promise.allSettled([
      deleteUserAvatar(userId),
      deleteUserCoverImage(userId)
    ])

    const errors = []
    
    if (avatarResult.status === 'rejected' || !avatarResult.value?.success) {
      errors.push(`Avatar: ${avatarResult.reason || avatarResult.value?.error}`)
    }
    
    if (coverResult.status === 'rejected' || !coverResult.value?.success) {
      errors.push(`Portada: ${coverResult.reason || coverResult.value?.error}`)
    }

    if (errors.length > 0) {
      return { 
        success: false, 
        error: `Errores eliminando archivos: ${errors.join(', ')}` 
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error en deleteUserMedia:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener URLs de archivos multimedia del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserMediaUrls = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url, cover_image_url')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error obteniendo URLs de media:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        avatar_url: data.avatar_url,
        cover_image_url: data.cover_image_url,
        has_avatar: !!data.avatar_url,
        has_cover: !!data.cover_image_url
      }
    }
  } catch (error) {
    console.error('Error en getUserMediaUrls:', error)
    return { success: false, error: error.message }
  }
}