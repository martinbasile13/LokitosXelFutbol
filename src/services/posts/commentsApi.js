// ===========================================
// COMMENTS API - SISTEMA COMPLETO DE COMENTARIOS
// ===========================================
// Responsabilidades:
// - Obtener comentarios en estructura de árbol
// - Crear comentarios
// - Eliminar comentarios
// - Manejar likes/dislikes de comentarios

import { supabase } from '../supabaseClient.js'

/**
 * Obtener comentarios en estructura de árbol - USANDO TABLA COMMENTS
 * @param {string} postId - ID del post
 * @param {string|null} userId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Comentarios organizados en árbol
 */
export const getCommentsTree = async (postId, userId = null) => {
  try {
    if (!postId) {
      throw new Error('postId es requerido')
    }

    console.log('💬 getCommentsTree usando tabla comments directa')

    // Obtener comentarios directamente de la tabla
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        image_url,
        video_url,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_comment_id,
        likes_count,
        dislikes_count
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    if (!comments || comments.length === 0) {
      return []
    }

    // Obtener perfiles de usuarios
    const userIds = [...new Set(comments.map(comment => comment.user_id))]
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, team')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    // Obtener votos del usuario si está autenticado
    let userCommentVotes = []
    if (userId) {
      const commentIds = comments.map(c => c.id)
      const { data: votesData } = await supabase
        .from('comment_likes')
        .select('comment_id, is_like')
        .in('comment_id', commentIds)
        .eq('user_id', userId)
      
      userCommentVotes = votesData || []
    }

    // Mapear votos del usuario
    const userVotesMap = {}
    userCommentVotes.forEach(vote => {
      userVotesMap[vote.comment_id] = vote.is_like === true ? 1 : vote.is_like === false ? -1 : 0
    })

    // Combinar comentarios con perfiles
    const commentsWithProfiles = comments.map(comment => ({
      ...comment,
      profiles: profiles?.find(profile => profile.id === comment.user_id) || null,
      user_vote: userVotesMap[comment.id] || 0,
      is_liked: userVotesMap[comment.id] === 1,
      is_disliked: userVotesMap[comment.id] === -1,
      replies: []
    }))

    // Organizar en estructura de árbol
    const commentsMap = new Map()
    const rootComments = []

    // Crear mapa de comentarios
    commentsWithProfiles.forEach(comment => {
      commentsMap.set(comment.id, comment)
    })

    // Organizar jerarquía
    commentsWithProfiles.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentsMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    })

    return rootComments
  } catch (error) {
    console.error('Error obteniendo comentarios en árbol:', error)
    throw error
  }
}

/**
 * Crear un nuevo comentario
 * @param {Object} commentData - Datos del comentario
 * @param {string} commentData.post_id - ID del post
 * @param {string} commentData.user_id - ID del usuario
 * @param {string} commentData.content - Contenido del comentario
 * @param {string|null} commentData.parent_comment_id - ID del comentario padre (opcional)
 * @param {string|null} commentData.image_url - URL de imagen (opcional)
 * @param {string|null} commentData.video_url - URL de video (opcional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createComment = async (commentData) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: commentData.post_id,
        user_id: commentData.user_id,
        content: commentData.content,
        parent_comment_id: commentData.parent_comment_id || null,
        image_url: commentData.image_url || null,
        video_url: commentData.video_url || null
      })
      .select(`
        id,
        content,
        image_url,
        video_url,
        created_at,
        user_id,
        post_id,
        parent_comment_id,
        likes_count,
        dislikes_count
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Obtener perfil del usuario por separado
    if (data && data.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, team')
        .eq('id', data.user_id)
        .single()

      const commentWithProfile = {
        ...data,
        profiles: profile || null,
        user_vote: 0,
        is_liked: false,
        is_disliked: false,
        replies: []
      }

      return { success: true, data: commentWithProfile }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar un comentario
 * @param {string} commentId - ID del comentario
 * @param {string} userId - ID del usuario que elimina
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deleteComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      throw new Error('commentId y userId son requeridos')
    }

    // Verificar que el comentario existe y pertenece al usuario
    const { data: existingComment, error: checkError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (checkError) {
      throw checkError
    }

    if (!existingComment) {
      throw new Error('Comentario no encontrado')
    }

    if (existingComment.user_id !== userId) {
      throw new Error('No tienes permisos para eliminar este comentario')
    }

    // Eliminar votos del comentario primero
    const { error: deleteVotesError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)

    if (deleteVotesError) {
      console.warn('Error eliminando votos del comentario:', deleteVotesError)
    }

    // Eliminar el comentario
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)
      .select()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Dar like a un comentario - CON INTERCAMBIO AUTOMÁTICO OPTIMIZADO
 * @param {string} commentId - ID del comentario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const likeComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { success: false, error: 'commentId y userId son requeridos' }
    }

    console.log('👍 Procesando like de comentario:', { commentId, userId })

    // 1. Verificar si ya tiene algún voto (like o dislike)
    const { data: existingVote } = await supabase
      .from('comment_likes')
      .select('is_like')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      if (existingVote.is_like === true) {
        // Ya tiene like - remover like
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
        
        console.log('❌ Like de comentario removido')
      } else {
        // Tiene dislike - cambiar a like (UPDATE optimizado)
        await supabase
          .from('comment_likes')
          .update({ is_like: true })
          .eq('comment_id', commentId)
          .eq('user_id', userId)
        
        console.log('🔄 Dislike cambiado a like')
      }
    } else {
      // No tiene voto - agregar like
      await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId, is_like: true })
      
      console.log('✅ Like de comentario agregado')
    }

    // Obtener conteos actualizados
    const { count: likes } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('is_like', true)

    const { count: dislikes } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('is_like', false)

    // Verificar voto actual del usuario
    const { data: currentVote } = await supabase
      .from('comment_likes')
      .select('is_like')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    const userVote = currentVote ? (currentVote.is_like ? 1 : -1) : 0

    return {
      success: true,
      data: {
        likes_count: likes || 0,
        dislikes_count: dislikes || 0,
        user_vote: userVote,
        user_liked: userVote === 1,
        user_disliked: userVote === -1,
        is_liked: userVote === 1,
        is_disliked: userVote === -1
      }
    }
  } catch (error) {
    console.error('💥 Error en likeComment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Dar dislike a un comentario - CON INTERCAMBIO AUTOMÁTICO OPTIMIZADO
 * @param {string} commentId - ID del comentario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const dislikeComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { success: false, error: 'commentId y userId son requeridos' }
    }

    console.log('👎 Procesando dislike de comentario:', { commentId, userId })

    // 1. Verificar si ya tiene algún voto (like o dislike)
    const { data: existingVote } = await supabase
      .from('comment_likes')
      .select('is_like')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      if (existingVote.is_like === false) {
        // Ya tiene dislike - remover dislike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
        
        console.log('❌ Dislike de comentario removido')
      } else {
        // Tiene like - cambiar a dislike (UPDATE optimizado)
        await supabase
          .from('comment_likes')
          .update({ is_like: false })
          .eq('comment_id', commentId)
          .eq('user_id', userId)
        
        console.log('🔄 Like cambiado a dislike')
      }
    } else {
      // No tiene voto - agregar dislike
      await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId, is_like: false })
      
      console.log('✅ Dislike de comentario agregado')
    }

    // Obtener conteos actualizados
    const { count: likes } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('is_like', true)

    const { count: dislikes } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('is_like', false)

    // Verificar voto actual del usuario
    const { data: currentVote } = await supabase
      .from('comment_likes')
      .select('is_like')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    const userVote = currentVote ? (currentVote.is_like ? 1 : -1) : 0

    return {
      success: true,
      data: {
        likes_count: likes || 0,
        dislikes_count: dislikes || 0,
        user_vote: userVote,
        user_liked: userVote === 1,
        user_disliked: userVote === -1,
        is_liked: userVote === 1,
        is_disliked: userVote === -1
      }
    }
  } catch (error) {
    console.error('💥 Error en dislikeComment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener el voto del usuario en un comentario
 * @param {string} commentId - ID del comentario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, vote?: number, error?: string}>}
 */
export const getUserCommentVote = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { success: false, error: 'commentId y userId son requeridos' }
    }

    // Usar consulta SQL directa en lugar de RPC
    const { data, error } = await supabase
      .from('comment_likes')
      .select('is_like')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return { success: false, error: error.message }
    }

    // Convertir a formato numérico: 1 = like, -1 = dislike, 0 = sin voto
    const vote = data ? (data.is_like ? 1 : -1) : 0

    return { success: true, vote }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Obtener estadísticas de un comentario
 * @param {string} commentId - ID del comentario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getCommentStats = async (commentId) => {
  try {
    if (!commentId) {
      throw new Error('commentId es requerido')
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .select('likes_count, dislikes_count')
      .eq('id', commentId)
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data: {
        likes_count: comment.likes_count || 0,
        dislikes_count: comment.dislikes_count || 0
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}