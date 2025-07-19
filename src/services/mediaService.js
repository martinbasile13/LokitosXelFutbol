import { supabase } from './supabaseClient'

// Configuración del storage
const STORAGE_BUCKET = 'avatars'

// Subir imagen de avatar a Supabase Storage
export const uploadAvatar = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image')
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    console.log('Subiendo avatar:', { fileName, fileSize: file.size, fileType: file.type })

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error subiendo avatar:', error)
      
      // Mensaje más claro para bucket no encontrado
      if (error.message === 'Bucket not found') {
        return { 
          success: false, 
          error: 'El bucket "avatars" no existe en Supabase Storage. Revisa las instrucciones en CONFIGURAR_STORAGE.md' 
        }
      }
      
      return { success: false, error: error.message }
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    console.log('Avatar subido exitosamente:', { filePath, publicUrl })

    return {
      success: true,
      data: {
        path: filePath,
        publicUrl: publicUrl,
        fileName: fileName
      }
    }

  } catch (error) {
    console.error('Error en uploadAvatar:', error)
    return { success: false, error: error.message }
  }
}

// Eliminar avatar anterior del storage
export const deleteAvatar = async (filePath) => {
  try {
    if (!filePath) return { success: true }

    // Extraer solo el path del archivo si viene una URL completa
    const path = filePath.includes('/avatars/') 
      ? filePath.split('/avatars/')[1] 
      : filePath.replace('avatars/', '')

    const fullPath = `avatars/${path}`

    console.log('Eliminando avatar anterior:', fullPath)

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fullPath])

    if (error) {
      console.error('Error eliminando avatar anterior:', error)
      // No bloqueamos el proceso si no se puede eliminar el archivo anterior
      return { success: true, warning: 'No se pudo eliminar el avatar anterior' }
    }

    console.log('Avatar anterior eliminado exitosamente')
    return { success: true }

  } catch (error) {
    console.error('Error en deleteAvatar:', error)
    return { success: true, warning: error.message }
  }
}

// Función para validar archivos
export const validateFile = (file, type = 'image') => {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' }
  }

  const maxSize = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024 // 50MB video, 5MB imagen
  
  if (file.size > maxSize) {
    const maxSizeText = type === 'video' ? '50MB' : '5MB'
    return { valid: false, error: `Archivo demasiado grande. Máximo ${maxSizeText}` }
  }
  
  const validTypes = type === 'video' 
    ? ['video/mp4', 'video/webm', 'video/ogg']
    : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
  
  if (!validTypes.includes(file.type)) {
    const validTypesText = type === 'video' 
      ? 'MP4, WebM, OGG'
      : 'JPEG, PNG, GIF, WebP'
    return { valid: false, error: `Tipo de archivo no válido. Formatos permitidos: ${validTypesText}` }
  }
  
  return { valid: true }
}

// Función para obtener el tamaño legible del archivo
export const getReadableFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 