// ===========================================
// POSTS API - CRUD BÁSICO DE POSTS
// ===========================================
// Responsabilidades:
// - Crear posts
// - Obtener posts individuales
// - Eliminar posts
// - Actualizar posts

import { supabase } from '../supabaseClient.js'

/**
 * Crear un nuevo post
 * @param {Object} postData - Datos del post
 * @returns {Promise<{success: boolean, data?: Object, error?: Object}>}
 */
export const createPost = async (postData) => {
  try {
    console.log('📝 Creando nuevo post:', postData)

    // Crear el post
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: postData.user_id,
        title: postData.title || '',
        content: postData.content,
        image_url: postData.image_url || null,
        video_url: postData.video_url || null
      })
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .single()

    if (postError) {
      console.error('Error creando post:', postError)
      return { success: false, error: postError }
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .eq('id', postData.user_id)
      .single()

    if (profileError) {
      console.warn('Error obteniendo perfil, devolviendo post sin perfil:', profileError)
      // Retornar post sin perfil si hay error
      return { 
        success: true, 
        data: {
          ...newPost,
          profiles: null,
          comments_count: 0,
          views_count: 0,
          likes_count: 0,
          dislikes_count: 0,
          user_vote: 0,
          is_liked: false,
          is_disliked: false
        }
      }
    }

    // Combinar post con perfil
    const postWithProfile = {
      ...newPost,
      profiles: profile,
      comments_count: 0,
      views_count: 0,
      likes_count: 0,
      dislikes_count: 0,
      user_vote: 0,
      is_liked: false,
      is_disliked: false
    }

    console.log('✅ Post creado exitosamente:', postWithProfile.id)
    return { success: true, data: postWithProfile }
  } catch (error) {
    console.error('💥 Error en createPost:', error)
    return { success: false, error }
  }
}

/**
 * Obtener un post por ID con todos los datos necesarios
 * @param {string} postId - ID del post
 * @param {string|null} userId - ID del usuario actual (para votos)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getPostById = async (postId, userId = null) => {
  try {
    if (!postId) {
      return { success: false, error: 'postId es requerido' }
    }

    console.log('🔍 Obteniendo post por ID:', { postId, userId })

    // Obtener post con contadores directos
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('Error obteniendo post:', postError)
      return { success: false, error: postError.message }
    }

    if (!post) {
      return { success: false, error: 'Post no encontrado' }
    }

    // Obtener perfil del usuario y contar comentarios en paralelo
    const [profileResult, commentsCount, userLikeResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .eq('id', post.user_id)
        .single(),
      
      supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId),

      // Obtener like/dislike del usuario si está autenticado
      userId ? supabase
        .from('post_likes')
        .select('is_like')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single() : Promise.resolve({ data: null })
    ])

    const { data: profile, error: profileError } = profileResult
    const { data: userLike, error: userLikeError } = userLikeResult

    if (profileError) {
      console.warn('⚠️ Error obteniendo perfil:', profileError)
    }

    if (userLikeError && userLikeError.code !== 'PGRST116') {
      console.warn('⚠️ Error obteniendo like del usuario:', userLikeError)
    }

    // Procesar like/dislike del usuario
    const userVoteValue = userLike ? (userLike.is_like ? 1 : -1) : 0

    // Combinar datos
    const postWithData = {
      ...post,
      profiles: profile || null,
      comments_count: commentsCount.count || 0,
      views_count: post.views_count || 0,
      likes_count: post.likes_count || 0,
      dislikes_count: post.dislikes_count || 0,
      user_vote: userVoteValue,
      is_liked: userVoteValue === 1,
      is_disliked: userVoteValue === -1
    }

    console.log('✅ Post obtenido exitosamente:', postWithData.id)
    return { success: true, data: postWithData }
  } catch (error) {
    console.error('💥 Error en getPostById:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar un post
 * @param {string} postId - ID del post a eliminar
 * @param {string} userId - ID del usuario que intenta eliminar
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deletePost = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      return { success: false, error: 'postId y userId son requeridos' }
    }

    console.log('🗑️ Eliminando post:', { postId, userId })

    // Verificar que el post existe y pertenece al usuario
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('user_id, image_url, video_url')
      .eq('id', postId)
      .single()

    if (checkError) {
      console.error('Error verificando post:', checkError)
      return { success: false, error: checkError.message }
    }

    if (!existingPost) {
      return { success: false, error: 'Post no encontrado' }
    }

    if (existingPost.user_id !== userId) {
      return { success: false, error: 'No tienes permisos para eliminar este post' }
    }

    // Primero eliminar comentarios asociados
    const { data: comments } = await supabase
      .from('comments')
      .select('id')
      .eq('post_id', postId)

    if (comments && comments.length > 0) {
      console.log(`🗑️ Eliminando ${comments.length} comentarios asociados`)
      
      const { error: deleteCommentsError } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', postId)

      if (deleteCommentsError) {
        console.error('Error eliminando comentarios:', deleteCommentsError)
        return { success: false, error: deleteCommentsError.message }
      }
    }

    // Eliminar likes/dislikes del post
    const { error: deleteLikesError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)

    if (deleteLikesError) {
      console.warn('⚠️ Error eliminando likes/dislikes (continuando):', deleteLikesError)
    }

    // Finalmente eliminar el post
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error eliminando post:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Post eliminado exitosamente:', postId)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en deletePost:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Actualizar un post
 * @param {string} postId - ID del post a actualizar
 * @param {Object} updateData - Datos a actualizar
 * @param {string} userId - ID del usuario que intenta actualizar
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updatePost = async (postId, updateData, userId) => {
  try {
    if (!postId || !userId) {
      return { success: false, error: 'postId y userId son requeridos' }
    }

    console.log('✏️ Actualizando post:', { postId, userId, updateData })

    // Verificar que el post existe y pertenece al usuario
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (checkError) {
      return { success: false, error: checkError.message }
    }

    if (!existingPost) {
      return { success: false, error: 'Post no encontrado' }
    }

    if (existingPost.user_id !== userId) {
      return { success: false, error: 'No tienes permisos para actualizar este post' }
    }

    // Preparar campos a actualizar
    const fieldsToUpdate = {}
    if (updateData.title !== undefined) fieldsToUpdate.title = updateData.title
    if (updateData.content !== undefined) fieldsToUpdate.content = updateData.content
    if (updateData.image_url !== undefined) fieldsToUpdate.image_url = updateData.image_url
    if (updateData.video_url !== undefined) fieldsToUpdate.video_url = updateData.video_url
    
    // Siempre actualizar timestamp
    fieldsToUpdate.updated_at = new Date().toISOString()

    // Actualizar el post
    const { data, error } = await supabase
      .from('posts')
      .update(fieldsToUpdate)
      .eq('id', postId)
      .eq('user_id', userId)
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        dislikes_count,
        created_at,
        updated_at,
        user_id
      `)
      .single()

    if (error) {
      console.error('Error actualizando post:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Post actualizado exitosamente:', postId)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en updatePost:', error)
    return { success: false, error: error.message }
  }
}