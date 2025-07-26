// ===========================================
// MEDIA SERVICE - FUNCIONES DE ARCHIVOS Y MULTIMEDIA
// ===========================================
// Este archivo mantiene compatibilidad con código existente
// redirigiendo a las funciones modulares

// Importar funciones de la estructura modular
import { 
  validateFile as validateFileModular,
  getReadableFileSize as getReadableSizeModular,
  uploadToCloudflare
} from './media/index.js'

import { 
  uploadAvatar as uploadAvatarModular,
  uploadCoverImage as uploadCoverModular,
  deleteAvatar as deleteAvatarModular,
  deleteCoverImage as deleteCoverModular
} from './media/index.js'

// ===================================
// FUNCIONES DE COMPATIBILIDAD
// ===================================

// Usar las funciones modulares para mantener consistencia
export const validateFile = validateFileModular
export const getReadableFileSize = getReadableSizeModular

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

// Usar las funciones modulares para avatars y covers
export const uploadAvatar = uploadAvatarModular
export const uploadCoverImage = uploadCoverModular
export const deleteAvatar = deleteAvatarModular
export const deleteCoverImageFromSupabase = deleteCoverModular