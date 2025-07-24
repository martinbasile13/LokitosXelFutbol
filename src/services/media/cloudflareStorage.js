// ===========================================
// CLOUDFLARE STORAGE - GESTIÓN DE CLOUDFLARE R2
// ===========================================
// Responsabilidades:
// - Subir archivos a Cloudflare R2
// - Eliminar archivos de Cloudflare R2
// - Configuración del worker de Cloudflare

import { validateFile } from './fileValidation.js'

/**
 * Configuración de Cloudflare
 */
const CLOUDFLARE_CONFIG = {
  WORKER_URL: 'https://falling-boat-f7d7.basiledev-oficial.workers.dev',
  ENDPOINTS: {
    UPLOAD: '/upload',
    DELETE: '/delete'
  }
}

/**
 * Subir archivo a Cloudflare R2
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta de destino (posts, avatars, covers)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadToCloudflare = async (file, folder = 'posts') => {
  try {
    // Validar el archivo antes de subirlo
    const validation = validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    console.log('Subiendo archivo a Cloudflare:', {
      name: file.name,
      size: file.size,
      type: file.type,
      folder
    })

    // Crear FormData para enviar al worker de Cloudflare
    const formData = new FormData()
    formData.append('file', file)
    
    // Subir a Cloudflare a través del worker
    const response = await fetch(`${CLOUDFLARE_CONFIG.WORKER_URL}${CLOUDFLARE_CONFIG.ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      body: formData,
    })

    console.log('Respuesta del worker:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response del worker:', errorText)
      
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || 'Error al subir el archivo')
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    }

    const data = await response.json()
    console.log('Datos recibidos del worker:', data)
    
    if (!data.success || !data.url) {
      throw new Error('Respuesta inválida del servidor')
    }

    return {
      success: true,
      data: {
        key: data.key,
        url: data.url,
        fileName: data.fileName || file.name
      }
    }
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar archivo de Cloudflare R2
 * @param {string} fileKey - Clave del archivo en R2
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFromCloudflare = async (fileKey) => {
  try {
    if (!fileKey) {
      return { success: true } // No hay nada que eliminar
    }

    console.log('Eliminando archivo de Cloudflare:', fileKey)
    
    const response = await fetch(`${CLOUDFLARE_CONFIG.WORKER_URL}${CLOUDFLARE_CONFIG.ENDPOINTS.DELETE}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: fileKey }),
    })

    console.log('Respuesta de eliminación:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error eliminando archivo:', errorText)
      
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || 'Error al eliminar el archivo')
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    }

    const data = await response.json()
    console.log('Archivo eliminado exitosamente:', data)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting from Cloudflare:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar media de posts de Cloudflare
 * @param {string} mediaUrl - URL del archivo a eliminar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deletePostMedia = async (mediaUrl) => {
  try {
    if (!mediaUrl) {
      return { success: true } // No hay nada que eliminar
    }

    // Extraer la key del archivo de la URL
    const urlParts = mediaUrl.split('/')
    const fileKey = urlParts[urlParts.length - 1]

    if (!fileKey) {
      console.warn('No se pudo extraer la key del archivo de la URL:', mediaUrl)
      return { success: true } // Continuar sin error
    }

    const deleteResult = await deleteFromCloudflare(`posts/${fileKey}`)
    
    if (!deleteResult.success) {
      console.error('Error eliminando media del post de Cloudflare:', deleteResult.error)
      return { success: false, error: deleteResult.error }
    }

    console.log('Media del post eliminada exitosamente de Cloudflare')
    return { success: true }

  } catch (error) {
    console.error('Error en deletePostMedia:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar avatar de Cloudflare (función específica)
 * @param {string} avatarUrl - URL del avatar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAvatarFromCloudflare = async (avatarUrl) => {
  try {
    if (!avatarUrl) {
      return { success: true } // No hay nada que eliminar
    }

    // Extraer la key del archivo de la URL
    const urlParts = avatarUrl.split('/')
    const fileKey = urlParts[urlParts.length - 1]

    if (!fileKey) {
      console.warn('No se pudo extraer la key del archivo de la URL:', avatarUrl)
      return { success: true } // Continuar sin error
    }

    const deleteResult = await deleteFromCloudflare(`avatars/${fileKey}`)
    
    if (!deleteResult.success) {
      console.error('Error eliminando avatar de Cloudflare:', deleteResult.error)
      // No retornar error para no bloquear la actualización del perfil
      return { success: true }
    }

    console.log('Avatar eliminado exitosamente de Cloudflare')
    return { success: true }

  } catch (error) {
    console.error('Error en deleteAvatarFromCloudflare:', error)
    // No retornar error para no bloquear la actualización del perfil
    return { success: true }
  }
}

/**
 * Eliminar imagen de portada de Cloudflare (función específica)
 * @param {string} coverUrl - URL de la portada
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCoverFromCloudflare = async (coverUrl) => {
  try {
    if (!coverUrl) {
      return { success: true } // No hay nada que eliminar
    }

    // Extraer la key del archivo de la URL
    const urlParts = coverUrl.split('/')
    const fileKey = urlParts[urlParts.length - 1]

    if (!fileKey) {
      console.warn('No se pudo extraer la key del archivo de la URL:', coverUrl)
      return { success: true } // Continuar sin error
    }

    const deleteResult = await deleteFromCloudflare(`covers/${fileKey}`)
    
    if (!deleteResult.success) {
      console.error('Error eliminando imagen de portada de Cloudflare:', deleteResult.error)
      // No retornar error para no bloquear la actualización del perfil
      return { success: true }
    }

    console.log('Imagen de portada eliminada exitosamente de Cloudflare')
    return { success: true }

  } catch (error) {
    console.error('Error en deleteCoverFromCloudflare:', error)
    // No retornar error para no bloquear la actualización del perfil
    return { success: true }
  }
}

/**
 * Obtener información de configuración de Cloudflare
 * @returns {Object} Configuración actual
 */
export const getCloudflareConfig = () => {
  return { ...CLOUDFLARE_CONFIG }
}