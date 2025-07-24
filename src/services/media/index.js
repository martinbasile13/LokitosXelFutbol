// ===========================================
// MEDIA SERVICES - PUNTO DE ENTRADA PRINCIPAL
// ===========================================
// Este archivo centraliza todas las exportaciones de los servicios de media
// para mantener una API limpia y fácil de importar

// ========== FILE VALIDATION ==========
export {
  validateFile,
  getReadableFileSize,
  optimizeImage,
  isImageFile,
  isVideoFile,
  getFileInfo,
  generateUniqueFileName
} from './fileValidation.js'

// ========== CLOUDFLARE STORAGE ==========
export {
  uploadToCloudflare,
  deleteFromCloudflare,
  deletePostMedia,
  deleteAvatarFromCloudflare,
  deleteCoverFromCloudflare,
  getCloudflareConfig
} from './cloudflareStorage.js'

// ========== SUPABASE STORAGE ==========
export {
  uploadAvatarToSupabase,
  uploadCoverImageToSupabase,
  uploadPostMediaToSupabase,
  deleteAvatarFromSupabase,
  deleteCoverImageFromSupabase,
  deletePostMediaFromSupabase,
  getSupabaseStorageConfig
} from './supabaseStorage.js'

// ========== MEDIA MANAGER ==========
export {
  uploadAvatar,
  uploadCoverImage,
  uploadPostMedia,
  deleteAvatar,
  deleteCoverImage,
  uploadFileToWorker,
  setStorageConfig,
  getStorageConfig,
  getAvailableServices
} from './mediaManager.js'