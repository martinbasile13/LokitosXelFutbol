// ===========================================
// FILE VALIDATION - VALIDACIÓN Y UTILIDADES DE ARCHIVOS
// ===========================================
// Responsabilidades:
// - Validar tipos y tamaños de archivos
// - Utilidades para archivos (tamaño legible, optimización)
// - Constantes de configuración de archivos

/**
 * Configuración de validación de archivos
 */
const FILE_CONFIG = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'],
  OPTIMIZATION: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1920,
    QUALITY: 0.8
  }
}

/**
 * Validar archivos según tipo y restricciones
 * @param {File} file - Archivo a validar
 * @param {string} type - Tipo de validación ('all', 'image', 'video')
 * @returns {{isValid: boolean, error?: string, valid?: boolean}}
 */
export const validateFile = (file, type = 'all') => {
  if (!file) {
    return { isValid: false, error: 'No se proporcionó ningún archivo' }
  }
  
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return { 
      isValid: false, 
      error: `El archivo es demasiado grande (máximo ${getReadableFileSize(FILE_CONFIG.MAX_SIZE)})` 
    }
  }
  
  const isImage = FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = FILE_CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type)
  
  switch (type) {
    case 'image':
      if (!isImage) {
        return { 
          isValid: false, 
          error: `Tipo de imagen no permitido. Formatos aceptados: ${FILE_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}` 
        }
      }
      break
    
    case 'video':
      if (!isVideo) {
        return { 
          isValid: false, 
          error: `Tipo de video no permitido. Formatos aceptados: ${FILE_CONFIG.ALLOWED_VIDEO_TYPES.join(', ')}` 
        }
      }
      break
    
    case 'all':
    default:
      if (!isImage && !isVideo) {
        return { 
          isValid: false, 
          error: 'Tipo de archivo no permitido. Solo se aceptan imágenes y videos' 
        }
      }
      break
  }
  
  return { isValid: true, valid: true }
}

/**
 * Convertir bytes a formato legible
 * @param {number} bytes - Número de bytes
 * @returns {string} Tamaño en formato legible
 */
export const getReadableFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Optimizar imagen redimensionándola y comprimiéndola
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo  
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<Blob>} Imagen optimizada
 */
export const optimizeImage = (file, maxWidth = FILE_CONFIG.OPTIMIZATION.MAX_WIDTH, maxHeight = FILE_CONFIG.OPTIMIZATION.MAX_HEIGHT, quality = FILE_CONFIG.OPTIMIZATION.QUALITY) => {
  return new Promise((resolve, reject) => {
    // Validar que es una imagen
    const validation = validateFile(file, 'image')
    if (!validation.isValid) {
      reject(new Error(validation.error))
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo la proporción
        const ratioWidth = maxWidth / img.width
        const ratioHeight = maxHeight / img.height
        const ratio = Math.min(ratioWidth, ratioHeight)
        
        const newWidth = Math.round(img.width * ratio)
        const newHeight = Math.round(img.height * ratio)

        canvas.width = newWidth
        canvas.height = newHeight

        // Dibujar imagen redimensionada con mejor calidad
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // Convertir a blob con la calidad especificada
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Error al optimizar la imagen'))
            }
          }, 
          file.type, 
          quality
        )
      } catch (error) {
        reject(new Error(`Error procesando imagen: ${error.message}`))
      }
    }

    img.onerror = () => {
      reject(new Error('Error cargando la imagen'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Verificar si un archivo es una imagen
 * @param {File} file - Archivo a verificar
 * @returns {boolean} True si es imagen
 */
export const isImageFile = (file) => {
  return FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file?.type)
}

/**
 * Verificar si un archivo es un video
 * @param {File} file - Archivo a verificar
 * @returns {boolean} True si es video
 */
export const isVideoFile = (file) => {
  return FILE_CONFIG.ALLOWED_VIDEO_TYPES.includes(file?.type)
}

/**
 * Obtener información detallada del archivo
 * @param {File} file - Archivo a analizar
 * @returns {Object} Información del archivo
 */
export const getFileInfo = (file) => {
  if (!file) {
    return null
  }

  return {
    name: file.name,
    size: file.size,
    sizeFormatted: getReadableFileSize(file.size),
    type: file.type,
    isImage: isImageFile(file),
    isVideo: isVideoFile(file),
    lastModified: new Date(file.lastModified),
    extension: file.name.split('.').pop()?.toLowerCase() || ''
  }
}

/**
 * Generar nombre único para archivo
 * @param {string} originalName - Nombre original del archivo
 * @param {string} userId - ID del usuario (opcional)
 * @param {string} prefix - Prefijo para el archivo (opcional)
 * @returns {string} Nombre único generado
 */
export const generateUniqueFileName = (originalName, userId = null, prefix = '') => {
  const extension = originalName.split('.').pop() || 'bin'
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  let fileName = ''
  if (prefix) {
    fileName += `${prefix}_`
  }
  if (userId) {
    fileName += `${userId}_`
  }
  fileName += `${timestamp}_${randomId}.${extension}`
  
  return fileName
}