// ===========================================
// SUPABASE STORAGE - GESTIÓN DE SUPABASE STORAGE
// ===========================================
// Responsabilidades:
// - Subir archivos a Supabase Storage
// - Eliminar archivos de Supabase Storage
// - Manejo de buckets específicos (avatars, covers)

import { supabase } from '../supabaseClient.js'
import { validateFile } from './fileValidation.js'

/**
 * Configuración de Supabase Storage
 */
const SUPABASE_STORAGE_CONFIG = {
  BUCKETS: {
    AVATARS: 'avatars',
    COVERS: 'covers',
    POSTS: 'posts'
  },
  UPLOAD_OPTIONS: {
    cacheControl: '3600',
    upsert: false
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 0 // Sin delay para mejor UX
  }
}

/**
 * Generar nombre único para archivo en Supabase
 * @param {string} originalName - Nombre original del archivo
 * @param {string} userId - ID del usuario
 * @param {string} prefix - Prefijo para el archivo
 * @returns {string} Nombre único generado
 */
const generateSupabaseFileName = (originalName, userId, prefix) => {
  const fileExtension = originalName.split('.').pop() || 'bin'
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  return `${prefix}_${userId}_${timestamp}_${randomId}.${fileExtension}`
}

/**
 * Subir archivo a Supabase Storage con reintentos para manejo de RLS
 * @param {File} file - Archivo a subir
 * @param {string} bucket - Bucket de destino
 * @param {string} fileName - Nombre del archivo
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const _uploadToSupabaseWithRetry = async (file, bucket, fileName) => {
  let uploadAttempts = 0
  let lastError = null

  while (uploadAttempts < SUPABASE_STORAGE_CONFIG.RETRY.MAX_ATTEMPTS) {
    uploadAttempts++
    
    try {
      console.log(`Intento ${uploadAttempts} de subida a bucket '${bucket}':`, fileName)

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          ...SUPABASE_STORAGE_CONFIG.UPLOAD_OPTIONS,
          contentType: file.type
        })

      if (error) {
        lastError = error
        console.error(`Error en intento ${uploadAttempts}:`, {
          error: error,
          message: error.message,
          statusCode: error.statusCode,
          fileName: fileName
        })

        // Si es un error RLS, intentar de nuevo
        if (error.message.includes('row-level security') || 
            error.message.includes('policy') || 
            error.statusCode === '403') {
          console.log(`Error RLS detectado en intento ${uploadAttempts}, reintentando...`)
          continue
        } else {
          // Si no es error RLS, no reintentar
          break
        }
      }

      console.log('Archivo subido exitosamente:', data)

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return {
        success: true,
        data: {
          path: data.path,
          publicUrl: urlData.publicUrl,
          fileName: file.name
        }
      }

    } catch (attemptError) {
      lastError = attemptError
      console.error(`Error en intento ${uploadAttempts}:`, attemptError)
      
      if (uploadAttempts >= SUPABASE_STORAGE_CONFIG.RETRY.MAX_ATTEMPTS) {
        break
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  console.error('Todos los intentos de subida fallaron. Último error:', lastError)
  return { 
    success: false, 
    error: `Error de Supabase Storage después de ${SUPABASE_STORAGE_CONFIG.RETRY.MAX_ATTEMPTS} intentos: ${lastError?.message || 'Error desconocido'}` 
  }
}

/**
 * Subir avatar a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadAvatarToSupabase = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image')
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    console.log('Subiendo avatar a Supabase Storage:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    })

    // Generar nombre único del archivo
    const fileName = generateSupabaseFileName(file.name, userId, 'avatar')
    
    console.log('Nombre del archivo generado:', fileName)

    return await _uploadToSupabaseWithRetry(
      file, 
      SUPABASE_STORAGE_CONFIG.BUCKETS.AVATARS, 
      fileName
    )

  } catch (error) {
    console.error('Error en uploadAvatarToSupabase:', error)
    return { success: false, error: `Error inesperado: ${error.message}` }
  }
}

/**
 * Subir imagen de portada a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadCoverImageToSupabase = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image')
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    console.log('Subiendo imagen de portada a Supabase Storage:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    })

    // Generar nombre único del archivo
    const fileName = generateSupabaseFileName(file.name, userId, 'cover')
    
    console.log('Nombre del archivo generado:', fileName)

    return await _uploadToSupabaseWithRetry(
      file, 
      SUPABASE_STORAGE_CONFIG.BUCKETS.COVERS, 
      fileName
    )

  } catch (error) {
    console.error('Error en uploadCoverImageToSupabase:', error)
    return { success: false, error: `Error inesperado: ${error.message}` }
  }
}

/**
 * Eliminar archivo de Supabase Storage
 * @param {string} bucket - Bucket de origen
 * @param {string} fileName - Nombre del archivo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const _deleteFromSupabaseStorage = async (bucket, fileName) => {
  try {
    if (!fileName) {
      return { success: true } // No hay nada que eliminar
    }

    console.log(`Eliminando archivo de Supabase Storage (${bucket}):`, fileName)

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      console.error(`Error eliminando archivo de ${bucket}:`, error)
      // No retornar error para no bloquear operaciones principales
      return { success: true }
    }

    console.log(`Archivo eliminado exitosamente de ${bucket}`)
    return { success: true }

  } catch (error) {
    console.error(`Error en _deleteFromSupabaseStorage (${bucket}):`, error)
    // No retornar error para no bloquear operaciones principales
    return { success: true }
  }
}

/**
 * Eliminar avatar de Supabase Storage
 * @param {string} avatarUrl - URL del avatar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAvatarFromSupabase = async (avatarUrl) => {
  try {
    if (!avatarUrl) {
      return { success: true } // No hay nada que eliminar
    }

    // Extraer el nombre del archivo de la URL de Supabase
    const fileName = _extractFileNameFromSupabaseUrl(avatarUrl)

    if (!fileName || !fileName.startsWith('avatar_')) {
      console.warn('URL de avatar no válida para eliminar:', avatarUrl)
      return { success: true } // Continuar sin error
    }

    return await _deleteFromSupabaseStorage(
      SUPABASE_STORAGE_CONFIG.BUCKETS.AVATARS, 
      fileName
    )

  } catch (error) {
    console.error('Error en deleteAvatarFromSupabase:', error)
    return { success: true } // No bloquear operaciones principales
  }
}

/**
 * Eliminar imagen de portada de Supabase Storage
 * @param {string} coverUrl - URL de la portada
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCoverImageFromSupabase = async (coverUrl) => {
  try {
    if (!coverUrl) {
      return { success: true } // No hay nada que eliminar
    }

    // Extraer el nombre del archivo de la URL de Supabase
    const fileName = _extractFileNameFromSupabaseUrl(coverUrl)

    if (!fileName || !fileName.startsWith('cover_')) {
      console.warn('URL de portada no válida para eliminar:', coverUrl)
      return { success: true } // Continuar sin error
    }

    return await _deleteFromSupabaseStorage(
      SUPABASE_STORAGE_CONFIG.BUCKETS.COVERS, 
      fileName
    )

  } catch (error) {
    console.error('Error en deleteCoverImageFromSupabase:', error)
    return { success: true } // No bloquear operaciones principales
  }
}

/**
 * Subir archivo de post a Supabase Storage
 * @param {File} file - Archivo (imagen o video)
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadPostMediaToSupabase = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'all')
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    console.log('Subiendo media de post a Supabase Storage:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    })

    // Generar nombre único del archivo
    const fileName = generateSupabaseFileName(file.name, userId, 'post')
    
    console.log('Nombre del archivo generado:', fileName)

    return await _uploadToSupabaseWithRetry(
      file, 
      SUPABASE_STORAGE_CONFIG.BUCKETS.POSTS, 
      fileName
    )

  } catch (error) {
    console.error('Error en uploadPostMediaToSupabase:', error)
    return { success: false, error: `Error inesperado: ${error.message}` }
  }
}

/**
 * Eliminar media de post de Supabase Storage
 * @param {string} mediaUrl - URL del archivo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deletePostMediaFromSupabase = async (mediaUrl) => {
  try {
    if (!mediaUrl) {
      return { success: true } // No hay nada que eliminar
    }

    // Extraer el nombre del archivo de la URL de Supabase
    const fileName = _extractFileNameFromSupabaseUrl(mediaUrl)

    if (!fileName || !fileName.startsWith('post_')) {
      console.warn('URL de media no válida para eliminar:', mediaUrl)
      return { success: true } // Continuar sin error
    }

    return await _deleteFromSupabaseStorage(
      SUPABASE_STORAGE_CONFIG.BUCKETS.POSTS, 
      fileName
    )

  } catch (error) {
    console.error('Error en deletePostMediaFromSupabase:', error)
    return { success: true } // No bloquear operaciones principales
  }
}

// ===========================================
// FUNCIONES AUXILIARES PRIVADAS
// ===========================================

/**
 * Extraer nombre del archivo de una URL de Supabase Storage
 * @param {string} url - URL de Supabase Storage
 * @returns {string|null} Nombre del archivo o null
 */
const _extractFileNameFromSupabaseUrl = (url) => {
  try {
    if (!url) return null
    
    const urlParts = url.split('/')
    return urlParts[urlParts.length - 1]
  } catch (error) {
    console.error('Error extrayendo nombre de archivo de URL:', error)
    return null
  }
}

/**
 * Obtener configuración de Supabase Storage
 * @returns {Object} Configuración actual
 */
export const getSupabaseStorageConfig = () => {
  return { ...SUPABASE_STORAGE_CONFIG }
}