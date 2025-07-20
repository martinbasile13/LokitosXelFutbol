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

// Subir imagen de avatar a Cloudflare R2
export const uploadAvatar = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    console.log('Subiendo avatar:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // Subir archivo a Cloudflare R2
    const uploadResult = await uploadToCloudflare(file, 'avatars');
    
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    console.log('Avatar subido exitosamente a Cloudflare:', uploadResult.data);

    return {
      success: true,
      data: {
        path: uploadResult.data.key,
        publicUrl: uploadResult.data.url,
        fileName: file.name
      }
    };

  } catch (error) {
    console.error('Error en uploadAvatar:', error);
    return { success: false, error: error.message };
  }
};

// Subir media para posts (imágenes y videos)
export const uploadPostMedia = async (file) => {
  try {
    const validation = validateFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    console.log('Subiendo media del post:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    const uploadResult = await uploadToCloudflare(file, 'posts');
    
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    console.log('Media del post subido exitosamente:', uploadResult.data);

    return {
      success: true,
      data: {
        path: uploadResult.data.key,
        publicUrl: uploadResult.data.url,
        fileName: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'video'
      }
    };

  } catch (error) {
    console.error('Error en uploadPostMedia:', error);
    return { success: false, error: error.message };
  }
};

// NUEVAS FUNCIONES PARA SUPABASE STORAGE

// Subir imagen de portada a Supabase Storage
export const uploadCoverImageToSupabase = async (file, userId) => {
  try {
    // Validar archivo antes de subir
    const validation = validateFile(file, 'image');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    console.log('Subiendo imagen de portada a Supabase Storage:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // Generar nombre único del archivo
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `cover_${userId}_${Date.now()}.${fileExtension}`;

    console.log('Nombre del archivo:', fileName);
    console.log('Bucket de destino: covers');

    // Subir a Supabase Storage en el bucket 'covers'
    const { data, error } = await supabase.storage
      .from('covers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Error detallado subiendo imagen de portada a Supabase:', {
        error: error,
        message: error.message,
        statusCode: error.statusCode,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type
      });
      return { success: false, error: `Error de Supabase Storage: ${error.message}` };
    }

    console.log('Datos de subida exitosa:', data);

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

// Actualizar la función uploadCoverImage para usar Supabase
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