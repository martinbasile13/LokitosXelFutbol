// Configuración de Cloudflare - URL CORRECTA
const CLOUDFLARE_WORKER_URL = 'https://falling-boat-f7d7.basiledev-oficial.workers.dev'

import { supabase } from './supabaseClient'

// Función para validar archivos
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

// Función para obtener el tamaño legible del archivo
export const getReadableFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Función para subir archivo a Cloudflare R2
export const uploadToCloudflare = async (file, folder = 'posts') => {
  try {
    // Validar el archivo antes de subirlo
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    console.log('Subiendo archivo a Cloudflare:', {
      name: file.name,
      size: file.size,
      type: file.type,
      folder
    });

    // Crear FormData para enviar al worker de Cloudflare
    const formData = new FormData();
    formData.append('file', file);
    
    // Subir a Cloudflare a través del worker
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('Respuesta del worker:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response del worker:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Error al subir el archivo');
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Datos recibidos del worker:', data);
    
    if (!data.success || !data.url) {
      throw new Error('Respuesta inválida del servidor');
    }

    return {
      success: true,
      data: {
        key: data.key,
        url: data.url,
        fileName: data.fileName || file.name
      }
    };
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error);
    return { success: false, error: error.message };
  }
};

// NUEVAS FUNCIONES PARA SUPABASE STORAGE

// Subir avatar a Supabase Storage con manejo de RLS mejorado
export const uploadAvatarToSupabase = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    console.log('Subiendo avatar a Supabase Storage:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // Generar nombre único del archivo con timestamp más específico
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `avatar_${userId}_${timestamp}_${randomId}.${fileExtension}`;

    console.log('Nombre del archivo:', fileName);
    console.log('Bucket de destino: avatars');

    // Intentar subida con reintentos en caso de error RLS - SIN DELAYS
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;
      
      try {
        console.log(`Intento ${uploadAttempts} de subida de avatar...`);

        // Subir a Supabase Storage en el bucket 'avatars'
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (error) {
          lastError = error;
          console.error(`Error en intento ${uploadAttempts}:`, {
            error: error,
            message: error.message,
            statusCode: error.statusCode,
            fileName: fileName
          });

          // Si es un error RLS, intentar de nuevo sin delay
          if (error.message.includes('row-level security') || error.message.includes('policy') || error.statusCode === '403') {
            console.log(`Error RLS detectado en intento ${uploadAttempts}, reintentando inmediatamente...`);
            continue;
          } else {
            // Si no es error RLS, no reintentar
            break;
          }
        }

        console.log('Avatar subido exitosamente:', data);

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('URL pública generada:', urlData.publicUrl);

        return {
          success: true,
          data: {
            path: data.path,
            publicUrl: urlData.publicUrl,
            fileName: file.name
          }
        };

      } catch (attemptError) {
        lastError = attemptError;
        console.error(`Error en intento ${uploadAttempts}:`, attemptError);
        
        // Si es el último intento, salir del bucle
        if (uploadAttempts >= maxAttempts) {
          break;
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    console.error('Todos los intentos de subida fallaron. Último error:', lastError);
    return { 
      success: false, 
      error: `Error de Supabase Storage después de ${maxAttempts} intentos: ${lastError?.message || 'Error desconocido'}` 
    };

  } catch (error) {
    console.error('Error en uploadAvatarToSupabase:', error);
    return { success: false, error: `Error inesperado: ${error.message}` };
  }
};

// Eliminar avatar de Supabase Storage
export const deleteAvatarFromSupabase = async (avatarUrl) => {
  try {
    if (!avatarUrl) {
      return { success: true }; // No hay nada que eliminar
    }

    // Extraer el path del archivo de la URL de Supabase
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName || !fileName.startsWith('avatar_')) {
      console.warn('URL de avatar no válida para eliminar:', avatarUrl);
      return { success: true }; // Continuar sin error
    }

    console.log('Eliminando avatar de Supabase:', fileName);

    // Eliminar de Supabase Storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) {
      console.error('Error eliminando avatar de Supabase:', error);
      // No retornar error para no bloquear la actualización del perfil
      return { success: true };
    }

    console.log('Avatar eliminado exitosamente de Supabase');
    return { success: true };

  } catch (error) {
    console.error('Error en deleteAvatarFromSupabase:', error);
    // No retornar error para no bloquear la actualización del perfil
    return { success: true };
  }
};

// Subir imagen de portada a Supabase Storage con manejo de RLS mejorado
export const uploadCoverImageToSupabase = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    console.log('Subiendo imagen de portada a Supabase Storage:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // Generar nombre único del archivo con timestamp más específico
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `cover_${userId}_${timestamp}_${randomId}.${fileExtension}`;

    console.log('Nombre del archivo:', fileName);
    console.log('Bucket de destino: covers');

    // Intentar subida con reintentos en caso de error RLS - SIN DELAYS
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;
      
      try {
        console.log(`Intento ${uploadAttempts} de subida de portada...`);

        // Subir a Supabase Storage en el bucket 'covers'
        const { data, error } = await supabase.storage
          .from('covers')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (error) {
          lastError = error;
          console.error(`Error en intento ${uploadAttempts}:`, {
            error: error,
            message: error.message,
            statusCode: error.statusCode,
            fileName: fileName
          });

          // Si es un error RLS, intentar de nuevo sin delay
          if (error.message.includes('row-level security') || error.message.includes('policy') || error.statusCode === '403') {
            console.log(`Error RLS detectado en intento ${uploadAttempts}, reintentando inmediatamente...`);
            continue;
          } else {
            // Si no es error RLS, no reintentar
            break;
          }
        }

        console.log('Portada subida exitosamente:', data);

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);

        console.log('URL pública generada:', urlData.publicUrl);

        return {
          success: true,
          data: {
            path: data.path,
            publicUrl: urlData.publicUrl,
            fileName: file.name
          }
        };

      } catch (attemptError) {
        lastError = attemptError;
        console.error(`Error en intento ${uploadAttempts}:`, attemptError);
        
        // Si es el último intento, salir del bucle
        if (uploadAttempts >= maxAttempts) {
          break;
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    console.error('Todos los intentos de subida fallaron. Último error:', lastError);
    return { 
      success: false, 
      error: `Error de Supabase Storage después de ${maxAttempts} intentos: ${lastError?.message || 'Error desconocido'}` 
    };

  } catch (error) {
    console.error('Error en uploadCoverImageToSupabase:', error);
    return { success: false, error: `Error inesperado: ${error.message}` };
  }
};

// Eliminar imagen de portada de Supabase Storage
export const deleteCoverImageFromSupabase = async (coverUrl) => {
  try {
    if (!coverUrl) {
      return { success: true }; // No hay nada que eliminar
    }

    // Extraer el path del archivo de la URL de Supabase
    const urlParts = coverUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName || !fileName.startsWith('cover_')) {
      console.warn('URL de portada no válida para eliminar:', coverUrl);
      return { success: true }; // Continuar sin error
    }

    console.log('Eliminando imagen de portada de Supabase:', fileName);

    // Eliminar de Supabase Storage
    const { error } = await supabase.storage
      .from('covers')
      .remove([fileName]);

    if (error) {
      console.error('Error eliminando imagen de portada de Supabase:', error);
      // No retornar error para no bloquear la actualización del perfil
      return { success: true };
    }

    console.log('Imagen de portada eliminada exitosamente de Supabase');
    return { success: true };

  } catch (error) {
    console.error('Error en deleteCoverImageFromSupabase:', error);
    // No retornar error para no bloquear la actualización del perfil
    return { success: true };
  }
};

// Actualizar las funciones principales para usar Supabase
export const uploadAvatar = async (file, userId) => {
  return await uploadAvatarToSupabase(file, userId);
};

export const uploadCoverImage = async (file, userId) => {
  return await uploadCoverImageToSupabase(file, userId);
};

// Eliminar archivo de Cloudflare R2
const deleteFromCloudflare = async (fileKey) => {
  try {
    console.log('Eliminando archivo de Cloudflare:', fileKey);
    
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: fileKey }),
    });

    console.log('Respuesta de eliminación:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error eliminando archivo:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Error al eliminar el archivo');
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Archivo eliminado exitosamente:', data);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Cloudflare:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar avatar
export const deleteAvatar = async (avatarUrl) => {
  try {
    if (!avatarUrl) {
      return { success: true }; // No hay nada que eliminar
    }

    // Extraer la key del archivo de la URL
    const urlParts = avatarUrl.split('/');
    const fileKey = urlParts[urlParts.length - 1];

    if (!fileKey) {
      console.warn('No se pudo extraer la key del archivo de la URL:', avatarUrl);
      return { success: true }; // Continuar sin error
    }

    const deleteResult = await deleteFromCloudflare(`avatars/${fileKey}`);
    
    if (!deleteResult.success) {
      console.error('Error eliminando avatar de Cloudflare:', deleteResult.error);
      // No retornar error para no bloquear la actualización del perfil
      return { success: true };
    }

    console.log('Avatar eliminado exitosamente de Cloudflare');
    return { success: true };

  } catch (error) {
    console.error('Error en deleteAvatar:', error);
    // No retornar error para no bloquear la actualización del perfil
    return { success: true };
  }
};

// Eliminar imagen de portada/cover
export const deleteCoverImage = async (coverUrl) => {
  try {
    if (!coverUrl) {
      return { success: true }; // No hay nada que eliminar
    }

    // Extraer la key del archivo de la URL
    const urlParts = coverUrl.split('/');
    const fileKey = urlParts[urlParts.length - 1];

    if (!fileKey) {
      console.warn('No se pudo extraer la key del archivo de la URL:', coverUrl);
      return { success: true }; // Continuar sin error
    }

    const deleteResult = await deleteFromCloudflare(`covers/${fileKey}`);
    
    if (!deleteResult.success) {
      console.error('Error eliminando imagen de portada de Cloudflare:', deleteResult.error);
      // No retornar error para no bloquear la actualización del perfil
      return { success: true };
    }

    console.log('Imagen de portada eliminada exitosamente de Cloudflare');
    return { success: true };

  } catch (error) {
    console.error('Error en deleteCoverImage:', error);
    // No retornar error para no bloquear la actualización del perfil
    return { success: true };
  }
};

// Eliminar media de posts
export const deletePostMedia = async (mediaUrl) => {
  try {
    if (!mediaUrl) {
      return { success: true }; // No hay nada que eliminar
    }

    // Extraer la key del archivo de la URL
    const urlParts = mediaUrl.split('/');
    const fileKey = urlParts[urlParts.length - 1];

    if (!fileKey) {
      console.warn('No se pudo extraer la key del archivo de la URL:', mediaUrl);
      return { success: true }; // Continuar sin error
    }

    const deleteResult = await deleteFromCloudflare(`posts/${fileKey}`);
    
    if (!deleteResult.success) {
      console.error('Error eliminando media del post de Cloudflare:', deleteResult.error);
      return { success: false, error: deleteResult.error };
    }

    console.log('Media del post eliminada exitosamente de Cloudflare');
    return { success: true };

  } catch (error) {
    console.error('Error en deletePostMedia:', error);
    return { success: false, error: error.message };
  }
};

// Función para optimizar imágenes (opcional)
export const optimizeImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convertir a blob
      canvas.toBlob(resolve, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};