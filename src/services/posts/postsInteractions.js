// ===========================================
// POSTS INTERACTIONS - LIKES, DISLIKES Y VISTAS
// ===========================================
// Responsabilidades:
// - Manejar likes y dislikes de posts
// - Registrar vistas de posts
// - Obtener interacciones y votos de usuarios

import { supabase } from '../supabaseClient.js'

/**
 * Dar like a un post - CON INTERCAMBIO AUTOMÁTICO OPTIMIZADO
 * @param {string} postId - ID del post
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const likePost = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      return { success: false, error: 'postId y userId son requeridos' }
    }

    console.log('👍 Procesando like de post:', { postId, userId })

    // 1. Verificar si ya tiene algún voto (like o dislike)
    const { data: existingVote, error: checkError } = await supabase
      .from('post_likes')
      .select('is_like')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    // Manejar error específico cuando no hay registro
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando voto existente:', checkError)
      return { success: false, error: checkError.message }
    }

    if (existingVote) {
      if (existingVote.is_like === true) {
        // Ya tiene like - remover like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        
        if (deleteError) {
          console.error('Error removiendo like:', deleteError)
          
          // Manejo específico para diferentes tipos de errores
          if (deleteError.code === '406' || deleteError.message?.includes('406')) {
            console.warn('⚠️ Error 406 en DELETE - posible conflicto de políticas RLS')
            // Verificar si la operación realmente falló
            const { data: checkVote } = await supabase
              .from('post_likes')
              .select('is_like')
              .eq('post_id', postId)
              .eq('user_id', userId)
              .single()
            
            // Si el voto ya no existe, la operación fue exitosa
            if (!checkVote) {
              console.log('✅ Like removido exitosamente (a pesar del error 406)')
            } else {
              return { success: false, error: 'No se pudo remover el like' }
            }
          } else {
            return { success: false, error: deleteError.message }
          }
        }
        
        console.log('❌ Like de post removido')
      } else {
        // Tiene dislike - ELIMINAR Y AGREGAR LIKE (en lugar de UPDATE)
        console.log('🔄 Eliminando dislike y agregando like...')
        
        // Primero eliminar el dislike
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        
        if (deleteError) {
          console.error('Error eliminando dislike:', deleteError)
          return { success: false, error: deleteError.message }
        }
        
        // Luego agregar el like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId, is_like: true })
        
        if (insertError) {
          console.error('Error agregando like después de eliminar dislike:', insertError)
          return { success: false, error: insertError.message }
        }
        
        console.log('🔄 Dislike eliminado y like agregado')
      }
    } else {
      // No tiene voto - agregar like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId, is_like: true })
      
      if (insertError) {
        console.error('Error agregando like:', insertError)
        return { success: false, error: insertError.message }
      }
      
      console.log('✅ Like de post agregado')
    }

    // Obtener conteos actualizados
    const { count: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_like', true)

    if (likesError) {
      console.error('Error contando likes:', likesError)
      return { success: false, error: likesError.message }
    }

    const { count: dislikes, error: dislikesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_like', false)

    if (dislikesError) {
      console.error('Error contando dislikes:', dislikesError)
      return { success: false, error: dislikesError.message }
    }

    // Verificar voto actual del usuario después de un pequeño delay
    // para asegurar que la transacción se complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: currentVote, error: voteError } = await supabase
      .from('post_likes')
      .select('is_like')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    // Solo reportar error si no es el caso de "no encontrado"
    if (voteError && voteError.code !== 'PGRST116') {
      console.error('Error verificando voto actual:', voteError)
      return { success: false, error: voteError.message }
    }

    const userVote = currentVote ? (currentVote.is_like ? 1 : -1) : 0
    
    console.log('🔍 Voto final verificado (LIKE):', { 
      currentVote, 
      userVote, 
      likes_count: likes || 0, 
      dislikes_count: dislikes || 0 
    })

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
    console.error('💥 Error en likePost:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Dar dislike a un post - CON INTERCAMBIO AUTOMÁTICO CORREGIDO
 * @param {string} postId - ID del post
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const dislikePost = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      return { success: false, error: 'postId y userId son requeridos' }
    }

    console.log('👎 Procesando dislike de post:', { postId, userId })

    // 1. Verificar si ya tiene algún voto (like o dislike)
    const { data: existingVote, error: checkError } = await supabase
      .from('post_likes')
      .select('is_like')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    // Manejar error específico cuando no hay registro
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando voto existente:', checkError)
      return { success: false, error: checkError.message }
    }

    if (existingVote) {
      if (existingVote.is_like === false) {
        // Ya tiene dislike - remover dislike
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        
        if (deleteError) {
          console.error('Error removiendo dislike:', deleteError)
          
          // Manejo específico para diferentes tipos de errores
          if (deleteError.code === '406' || deleteError.message?.includes('406')) {
            console.warn('⚠️ Error 406 en DELETE - posible conflicto de políticas RLS')
            // Verificar si la operación realmente falló
            const { data: checkVote } = await supabase
              .from('post_likes')
              .select('is_like')
              .eq('post_id', postId)
              .eq('user_id', userId)
              .single()
            
            // Si el voto ya no existe, la operación fue exitosa
            if (!checkVote) {
              console.log('✅ Dislike removido exitosamente (a pesar del error 406)')
            } else {
              return { success: false, error: 'No se pudo remover el dislike' }
            }
          } else {
            return { success: false, error: deleteError.message }
          }
        }
        
        console.log('❌ Dislike de post removido')
      } else {
        // Tiene like - ELIMINAR Y AGREGAR DISLIKE (en lugar de UPDATE)
        console.log('🔄 Eliminando like y agregando dislike...')
        
        // Primero eliminar el like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        
        if (deleteError) {
          console.error('Error eliminando like:', deleteError)
          return { success: false, error: deleteError.message }
        }
        
        // Luego agregar el dislike
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId, is_like: false })
        
        if (insertError) {
          console.error('Error agregando dislike después de eliminar like:', insertError)
          return { success: false, error: insertError.message }
        }
        
        console.log('🔄 Like eliminado y dislike agregado')
      }
    } else {
      // No tiene voto - agregar dislike
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId, is_like: false })
      
      if (insertError) {
        console.error('Error agregando dislike:', insertError)
        return { success: false, error: insertError.message }
      }
      
      console.log('✅ Dislike de post agregado')
    }

    // Obtener conteos actualizados
    const { count: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_like', true)

    if (likesError) {
      console.error('Error contando likes:', likesError)
      return { success: false, error: likesError.message }
    }

    const { count: dislikes, error: dislikesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_like', false)

    if (dislikesError) {
      console.error('Error contando dislikes:', dislikesError)
      return { success: false, error: dislikesError.message }
    }

    // Verificar voto actual del usuario después de un pequeño delay
    // para asegurar que la transacción se complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: currentVote, error: voteError } = await supabase
      .from('post_likes')
      .select('is_like')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    // Solo reportar error si no es el caso de "no encontrado"
    if (voteError && voteError.code !== 'PGRST116') {
      console.error('Error verificando voto actual:', voteError)
      return { success: false, error: voteError.message }
    }

    const userVote = currentVote ? (currentVote.is_like ? 1 : -1) : 0
    
    console.log('🔍 Voto final verificado:', { 
      currentVote, 
      userVote, 
      likes_count: likes || 0, 
      dislikes_count: dislikes || 0 
    })

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
    console.error('💥 Error en dislikePost:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Registrar vista de un post
 * @param {string} postId - ID del post
 * @param {string|null} userId - ID del usuario (opcional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const addPostView = async (postId, userId = null) => {
  try {
    if (!postId) {
      return { success: false, error: 'Post ID requerido' }
    }

    console.log('👁️ Registrando vista de post:', { postId, userId })

    // Primero obtener el valor actual
    const { data: currentPost, error: getError } = await supabase
      .from('posts')
      .select('views_count')
      .eq('id', postId)
      .single()

    if (getError) {
      console.error('Error obteniendo post actual:', getError)
      return { success: false, error: getError.message }
    }

    // Incrementar vistas manualmente
    const newViewsCount = (currentPost.views_count || 0) + 1
    
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        views_count: newViewsCount
      })
      .eq('id', postId)
      .select('views_count')

    if (error) {
      console.error('Error incrementando vistas:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Vista registrada exitosamente')
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en addPostView:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener interacciones de un post (likes, dislikes, vistas)
 * @param {string} postId - ID del post
 * @param {string|null} userId - ID del usuario (para obtener su voto)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getPostInteractions = async (postId, userId = null) => {
  try {
    if (!postId) {
      return { success: false, error: 'postId es requerido' }
    }

    // Obtener datos básicos del post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('views_count, likes_count, dislikes_count')
      .eq('id', postId)
      .single()

    if (postError) {
      return { success: false, error: postError.message }
    }

    let userLiked = false
    let userDisliked = false

    // Si hay usuario, obtener su voto desde post_likes
    if (userId) {
      const { data: userLike } = await supabase
        .from('post_likes')
        .select('is_like')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

      if (userLike) {
        userLiked = userLike.is_like === true
        userDisliked = userLike.is_like === false
      }
    }

    const userVote = userLiked ? 1 : userDisliked ? -1 : 0

    return {
      success: true,
      data: {
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        dislikes_count: post.dislikes_count || 0,
        user_vote: userVote,
        is_liked: userLiked,
        is_disliked: userDisliked
      }
    }
  } catch (error) {
    console.error('💥 Error en getPostInteractions:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener voto del usuario en un post específico
 * @param {string} postId - ID del post
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, vote?: number, error?: string}>}
 */
export const getUserPostVote = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      return { success: false, error: 'postId y userId son requeridos' }
    }

    const { data: userLike, error } = await supabase
      .from('post_likes')
      .select('is_like')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }

    // Convertir is_like a formato de voto: true=1, false=-1, null=0
    const userVote = userLike ? (userLike.is_like ? 1 : -1) : 0

    return {
      success: true,
      vote: userVote
    }
  } catch (error) {
    console.error('💥 Error en getUserPostVote:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener estadísticas completas de interacciones de múltiples posts
 * @param {Array} postIds - IDs de posts
 * @param {string|null} userId - ID del usuario (para obtener sus votos)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getMultiplePostsInteractions = async (postIds, userId = null) => {
  try {
    if (!postIds || postIds.length === 0) {
      return { success: true, data: {} }
    }

    // Obtener todos los likes/dislikes para estos posts
    const { data: allLikes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id, is_like')
      .in('post_id', postIds)

    if (likesError) {
      return { success: false, error: likesError.message }
    }

    // Obtener likes/dislikes del usuario si está autenticado
    let userLikes = []
    if (userId) {
      const { data: userLikesData, error: userLikesError } = await supabase
        .from('post_likes')
        .select('post_id, is_like')
        .in('post_id', postIds)
        .eq('user_id', userId)

      if (!userLikesError) {
        userLikes = userLikesData || []
      }
    }

    // Procesar datos
    const interactions = {}
    
    postIds.forEach(postId => {
      interactions[postId] = {
        likes_count: 0,
        dislikes_count: 0,
        user_vote: 0,
        is_liked: false,
        is_disliked: false
      }
    })

    // Contar likes y dislikes
    allLikes?.forEach(like => {
      if (like.is_like === true) {
        interactions[like.post_id].likes_count++
      } else if (like.is_like === false) {
        interactions[like.post_id].dislikes_count++
      }
    })

    // Mapear likes/dislikes del usuario
    userLikes.forEach(like => {
      const userVote = like.is_like === true ? 1 : like.is_like === false ? -1 : 0
      interactions[like.post_id].user_vote = userVote
      interactions[like.post_id].is_liked = userVote === 1
      interactions[like.post_id].is_disliked = userVote === -1
    })

    return {
      success: true,
      data: interactions
    }
  } catch (error) {
    console.error('💥 Error en getMultiplePostsInteractions:', error)
    return { success: false, error: error.message }
  }
}