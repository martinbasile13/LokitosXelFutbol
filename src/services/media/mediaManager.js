// ===========================================
// MEDIA MANAGER - GESTIÓN GENERAL Y ORQUESTACIÓN
// ===========================================
// Responsabilidades:
// - Orquestar servicios de Cloudflare y Supabase
// - Funciones principales de upload/delete
// - Compatibilidad con código existente

import { uploadAvatarToSupabase, uploadCoverImageToSupabase, deleteAvatarFromSupabase, deleteCoverImageFromSupabase } from './supabaseStorage.js'
import { uploadToCloudflare, deleteAvatarFromCloudflare, deleteCoverFromCloudflare } from './cloudflareStorage.js'

/**
 * Configuración del manager de media
 */
const MEDIA_MANAGER_CONFIG = {
  // Por defecto usar Supabase para avatars y covers, Cloudflare para posts
  DEFAULT_STORAGE: {
    AVATARS: 'supabase',
    COVERS: 'supabase', 
    POSTS: 'cloudflare'
  }
}

/**
 * Subir avatar (usando Supabase por defecto)
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadAvatar = async (file, userId) => {
  try {
    console.log('📸 Subiendo avatar via Media Manager...')
    
    // Usar Supabase por defecto para avatars
    const result = await uploadAvatarToSupabase(file, userId)
    
    if (result.success) {
      console.log('✅ Avatar subido exitosamente via Supabase')
    } else {
      console.error('❌ Error subiendo avatar via Supabase:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('💥 Error en uploadAvatar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subir imagen de portada (usando Supabase por defecto)
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadCoverImage = async (file, userId) => {
  try {
    console.log('🖼️ Subiendo imagen de portada via Media Manager...')
    
    // Usar Supabase por defecto para covers
    const result = await uploadCoverImageToSupabase(file, userId)
    
    if (result.success) {
      console.log('✅ Imagen de portada subida exitosamente via Supabase')
    } else {
      console.error('❌ Error subiendo imagen de portada via Supabase:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('💥 Error en uploadCoverImage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar avatar (con fallback entre servicios)
 * @param {string} avatarUrl - URL del avatar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAvatar = async (avatarUrl) => {
  try {
    if (!avatarUrl) {
      return { success: true } // No hay nada que eliminar
    }

    console.log('🗑️ Eliminando avatar via Media Manager...')

    // Detectar el servicio basado en la URL
    if (avatarUrl.includes('supabase')) {
      console.log('🎯 Detectado avatar de Supabase, eliminando...')
      return await deleteAvatarFromSupabase(avatarUrl)
    } else {
      console.log('☁️ Asumiendo avatar de Cloudflare, eliminando...')
      return await deleteAvatarFromCloudflare(avatarUrl)
    }
  } catch (error) {
    console.error('💥 Error en deleteAvatar:', error)
    // No retornar error para no bloquear la actualización del perfil
    return { success: true }
  }
}

/**
 * Eliminar imagen de portada (con fallback entre servicios)
 * @param {string} coverUrl - URL de la portada
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCoverImage = async (coverUrl) => {
  try {
    if (!coverUrl) {
      return { success: true } // No hay nada que eliminar
    }

    console.log('🗑️ Eliminando imagen de portada via Media Manager...')

    // Detectar el servicio basado en la URL
    if (coverUrl.includes('supabase')) {
      console.log('🎯 Detectado cover de Supabase, eliminando...')
      return await deleteCoverImageFromSupabase(coverUrl)
    } else {
      console.log('☁️ Asumiendo cover de Cloudflare, eliminando...')
      return await deleteCoverFromCloudflare(coverUrl)
    }
  } catch (error) {
    console.error('💥 Error en deleteCoverImage:', error)
    // No retornar error para no bloquear la actualización del perfil
    return { success: true }
  }
}

/**
 * Subir archivo a Cloudflare Worker (función de compatibilidad)
 * @param {File} file - Archivo a subir
 * @returns {Promise<string>} URL del archivo subido
 */
export const uploadFileToWorker = async (file) => {
  try {
    console.log('📤 Subiendo archivo via Worker (función de compatibilidad)...')
    
    const result = await uploadToCloudflare(file, 'posts')
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    console.log('✅ Archivo subido exitosamente via Worker')
    return result.data.url
  } catch (error) {
    console.error('❌ Error en uploadFileToWorker:', error)
    throw new Error(`Error subiendo archivo: ${error.message}`)
  }
}

/**
 * Subir media para posts (usando Cloudflare por defecto)
 * @param {File} file - Archivo (imagen o video)
 * @param {string} userId - ID del usuario (opcional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadPostMedia = async (file, userId = null) => {
  try {
    console.log('📱 Subiendo media de post via Media Manager...')
    
    // Usar Cloudflare por defecto para posts
    const result = await uploadToCloudflare(file, 'posts')
    
    if (result.success) {
      console.log('✅ Media de post subida exitosamente via Cloudflare')
    } else {
      console.error('❌ Error subiendo media de post via Cloudflare:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('💥 Error en uploadPostMedia:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cambiar configuración de almacenamiento por defecto
 * @param {Object} newConfig - Nueva configuración
 * @param {string} newConfig.avatars - Servicio para avatars ('supabase' | 'cloudflare')
 * @param {string} newConfig.covers - Servicio para covers ('supabase' | 'cloudflare')
 * @param {string} newConfig.posts - Servicio para posts ('supabase' | 'cloudflare')
 */
export const setStorageConfig = (newConfig) => {
  if (newConfig.avatars) {
    MEDIA_MANAGER_CONFIG.DEFAULT_STORAGE.AVATARS = newConfig.avatars
  }
  if (newConfig.covers) {
    MEDIA_MANAGER_CONFIG.DEFAULT_STORAGE.COVERS = newConfig.covers
  }
  if (newConfig.posts) {
    MEDIA_MANAGER_CONFIG.DEFAULT_STORAGE.POSTS = newConfig.posts
  }
  
  console.log('⚙️ Configuración de almacenamiento actualizada:', MEDIA_MANAGER_CONFIG.DEFAULT_STORAGE)
}

/**
 * Obtener configuración actual de almacenamiento
 * @returns {Object} Configuración actual
 */
export const getStorageConfig = () => {
  return { ...MEDIA_MANAGER_CONFIG.DEFAULT_STORAGE }
}

/**
 * Obtener información sobre los servicios disponibles
 * @returns {Object} Información de servicios
 */
export const getAvailableServices = () => {
  return {
    services: ['cloudflare', 'supabase'],
    current_defaults: { ...MEDIA_MANAGER_CONFIG.DEFAULT_STORAGE },
    description: {
      cloudflare: 'Cloudflare R2 - Ideal para archivos grandes y CDN global',
      supabase: 'Supabase Storage - Integrado con RLS y autenticación'
    }
  }
}