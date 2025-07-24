// ===========================================
// MEDIA SERVICE - FUNCIONES DE ARCHIVOS Y MULTIMEDIA
// ===========================================
// Este archivo contiene solo las funciones de media que son específicas
// y no están en la estructura modular de /services/media/

// Configuración de Cloudflare - URL CORRECTA
const CLOUDFLARE_WORKER_URL = 'https://falling-boat-f7d7.basiledev-oficial.workers.dev'

import { supabase } from './supabaseClient'

// ===================================
// VALIDACIÓN DE ARCHIVOS
// ===================================

export const validateFile = (file, type = 'all') => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'];
  
  if (!file) {
    return { isValid: false, error: 'No se proporcionó ningún archivo' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'El archivo es demasiado grande (máximo 50MB)' };
  }
  
  if (type === 'image' && !allowedImageTypes.includes(file.type)) {
    return { isValid: false, error: 'Tipo de imagen no permitido' };
  }
  
  if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
    return { isValid: false, error: 'Tipo de video no permitido' };
  }
  
  if (type === 'all' && ![...allowedImageTypes, ...allowedVideoTypes].includes(file.type)) {
    return { isValid: false, error: 'Tipo de archivo no permitido' };
  }
  
  return { isValid: true, valid: true };
};

export const getReadableFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ===================================
// SUBIDA DE ARCHIVOS A CLOUDFLARE
// ===================================

export const uploadFileToWorker = async (file) => {
  const UPLOAD_ENDPOINT = 'https://falling-boat-f7d7.basiledev-oficial.workers.dev/upload'
  
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error subiendo archivo')
  }

  const data = await response.json()
  return data.url
}

// ===================================
// AVATARES Y PORTADAS - SUPABASE STORAGE
// ===================================

export const uploadAvatar = async (file, userId) => {
  try {
    const validation = validateFile(file, 'image');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `avatar_${userId}_${timestamp}_${randomId}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fileName: file.name
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const uploadCoverImage = async (file, userId) => {
  try {
    const validation = validateFile(file, 'image');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `cover_${userId}_${timestamp}_${randomId}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('covers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('covers')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fileName: file.name
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAvatar = async (avatarUrl) => {
  try {
    if (!avatarUrl) return { success: true };

    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName || !fileName.startsWith('avatar_')) {
      return { success: true };
    }

    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    return { success: !error };
  } catch (error) {
    return { success: true }; // No bloquear operaciones por errores de limpieza
  }
};

export const deleteCoverImageFromSupabase = async (coverUrl) => {
  try {
    if (!coverUrl) return { success: true };

    const urlParts = coverUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName || !fileName.startsWith('cover_')) {
      return { success: true };
    }

    const { error } = await supabase.storage
      .from('covers')
      .remove([fileName]);

    return { success: !error };
  } catch (error) {
    return { success: true }; // No bloquear operaciones por errores de limpieza
  }
};