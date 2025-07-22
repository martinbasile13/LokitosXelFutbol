import { supabase } from './supabaseClient'

// Obtener posts del feed (ordenados por fecha) con datos de interacciones
export const getFeedPosts = async (limit = 20, offset = 0, userId = null) => {
  try {
    // Obtener los posts básicos CON LIKES_COUNT Y VIEWS_COUNT
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        created_at,
        updated_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      return []
    }

    if (!posts || posts.length === 0) {
      return []
    }

    // Obtener los IDs únicos de usuarios y posts
    const userIds = [...new Set(posts.map(post => post.user_id))]
    const postIds = posts.map(post => post.id)
    
    // Obtener perfiles de usuarios, conteo de comentarios y likes del usuario
    const [profilesResult, commentsCountResult, userLikesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .in('id', userIds),
      
      // Contar comentarios por post
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .then(({ data }) => {
          const counts = {}
          data?.forEach(comment => {
            counts[comment.post_id] = (counts[comment.post_id] || 0) + 1
          })
          return counts
        }),

      // Obtener likes del usuario si está logueado
      userId ? supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)
        .then(({ data }) => {
          const userLikes = {}
          data?.forEach(like => {
            userLikes[like.post_id] = true
          })
          return userLikes
        }) : Promise.resolve({})
    ])

    const { data: profiles, error: profilesError } = profilesResult

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    // Combinar posts con perfiles y datos de interacciones
    const postsWithData = posts.map(post => {
      const profile = profiles?.find(p => p.id === post.user_id)
      const commentsCount = commentsCountResult[post.id] || 0
      const isLikedByUser = userLikesResult[post.id] || false
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        is_liked: isLikedByUser
      }
    })

    return postsWithData
  } catch (error) {
    return []
  }
}

// Crear un nuevo post
export const createPost = async (postData) => {
  try {
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
        created_at,
        updated_at,
        user_id
      `)
      .single()

    if (postError) {
      return { success: false, error: postError }
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .eq('id', postData.user_id)
      .single()

    if (profileError) {
      // Retornar post sin perfil si hay error
      return { 
        success: true, 
        data: {
          ...newPost,
          profiles: null
        }
      }
    }

    // Combinar post con perfil
    const postWithProfile = {
      ...newPost,
      profiles: profile
    }

    return { success: true, data: postWithProfile }
  } catch (error) {
    return { success: false, error }
  }
}

// Eliminar un post
export const deletePost = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      throw new Error('postId y userId son requeridos')
    }

    // Verificar que el post existe y pertenece al usuario
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (checkError) {
      throw checkError
    }

    if (!existingPost) {
      throw new Error('Post no encontrado')
    }

    if (existingPost.user_id !== userId) {
      throw new Error('No tienes permisos para eliminar este post')
    }

    // Primero eliminar comentarios asociados
    const { data: comments } = await supabase
      .from('comments')
      .select('id')
      .eq('post_id', postId)

    if (comments && comments.length > 0) {
      const { error: deleteCommentsError } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', postId)

      if (deleteCommentsError) {
        throw deleteCommentsError
      }
    }

    // Ahora eliminar el post
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
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

// Obtener posts de un usuario específico with datos de interacciones
export const getUserPosts = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    // Obtener posts del usuario CON VIEWS_COUNT Y VOTES_COUNT
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
        likes_count,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      return []
    }

    if (!posts || posts.length === 0) {
      return []
    }

    const postIds = posts.map(post => post.id)

    // Obtener perfil del usuario, conteo de comentarios e interacciones en paralelo
    const [profileResult, commentsCountResult, interactions] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .eq('id', userId)
        .single(),
      
      // Contar comentarios por post
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .then(({ data }) => {
          const counts = {}
          data?.forEach(comment => {
            counts[comment.post_id] = (counts[comment.post_id] || 0) + 1
          })
          return counts
        }),
      
      // Obtener solo los likes del usuario (para estado de UI)
      getPostsInteractions(postIds, currentUserId)
    ])

    const { data: profile, error: profileError } = profileResult

    // Combinar posts con perfil e interacciones
    const postsWithData = posts.map(post => {
      const postInteractions = interactions[post.id] || {
        user_vote: null
      }
      
      const commentsCount = commentsCountResult[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        is_liked: postInteractions.user_vote === 1,
        ...postInteractions
      }
    })

    return postsWithData
  } catch (error) {
    return []
  }
}

// ================================
// FUNCIONES DE LIKES Y VIEWS
// ================================

// Registrar vista de un post - NUEVA IMPLEMENTACIÓN EFICAZ
export const addPostView = async (postId, userId = null) => {
  try {
    if (!postId) {
      return { success: false, error: 'Post ID requerido' }
    }

    // Incrementar contador de vistas directamente en la tabla posts
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        views_count: 1
      })
      .eq('id', postId)
      .select('views_count')

    // Si no existe views_count, obtener el valor actual y sumar 1
    if (!error && data && data.length === 0) {
      // Post no encontrado, intentar con COALESCE en PostgreSQL
      const { data: updateData, error: updateError } = await supabase
        .rpc('increment_post_views', { post_id: postId })

      if (updateError) {
        // Fallback: obtener valor actual y actualizar
        const { data: currentPost } = await supabase
          .from('posts')
          .select('views_count')
          .eq('id', postId)
          .single()

        const currentViews = currentPost?.views_count || 0
        
        const { data: finalData, error: finalError } = await supabase
          .from('posts')
          .update({ views_count: currentViews + 1 })
          .eq('id', postId)
          .select('views_count')

        if (finalError) {
          return { success: false, error: finalError.message }
        }

        return { success: true, data: finalData }
      }

      return { success: true, data: updateData }
    }

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Dar like a un post - IMPLEMENTACIÓN CORREGIDA
export const likePost = async (postId, userId) => {
  try {
    // Verificar si ya existe un like de este usuario (sin .single())
    const { data: existingLikes, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (checkError) {
      return { success: false, error: checkError }
    }

    if (existingLikes && existingLikes.length > 0) {
      return { success: false, error: { message: 'Ya has dado like a este post' } }
    }

    // Registrar el like en la tabla post_likes
    const { data, error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: userId
      })
      .select('post_id, user_id')

    if (error) {
      return { success: false, error }
    }

    // Incrementar el contador en la tabla posts usando la función SQL
    const { data: updateResult, error: updateError } = await supabase
      .rpc('increment_post_likes', { post_id: postId })

    if (updateError) {
      // Si falla la función SQL, hacer fallback manual
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single()

      const currentLikes = currentPost?.likes_count || 0
      
      await supabase
        .from('posts')
        .update({ likes_count: currentLikes + 1 })
        .eq('id', postId)
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Quitar like a un post - IMPLEMENTACIÓN CORREGIDA
export const unlikePost = async (postId, userId) => {
  try {
    // Eliminar el like de la tabla post_likes
    const { data, error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select('post_id, user_id')

    if (error) {
      return { success: false, error }
    }

    // Si no se eliminó ninguna fila, el like no existía
    if (!data || data.length === 0) {
      return { success: false, error: { message: 'No has dado like a este post' } }
    }

    // Decrementar el contador en la tabla posts usando la función SQL
    const { data: updateResult, error: updateError } = await supabase
      .rpc('decrement_post_likes', { post_id: postId })

    if (updateError) {
      // Si falla la función SQL, hacer fallback manual
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single()

      const currentLikes = currentPost?.likes_count || 0
      
      await supabase
        .from('posts')
        .update({ likes_count: Math.max(0, currentLikes - 1) })
        .eq('id', postId)
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Obtener datos de interacciones - SUPER SIMPLIFICADO (sin necesidad de rastrear votos individuales)
export const getPostsInteractions = async (postIds, userId = null) => {
  try {
    if (!postIds || postIds.length === 0) {
      return {}
    }

    // Ya no necesitamos verificar votos individuales, solo retornamos estructura vacía
    // Los contadores vienen directamente de la tabla posts
    const result = {}
    postIds.forEach(postId => {
      result[postId] = {
        user_vote: null // Siempre null porque no rastreamos votos individuales
      }
    })

    return result
  } catch (error) {
    return {}
  }
}

// ================================
// FUNCIONES DE COMENTARIOS
// ================================

// Obtener un post por ID con datos de interacciones
export const getPostById = async (postId, userId = null) => {
  try {
    if (!postId) {
      throw new Error('postId es requerido')
    }

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
        created_at,
        updated_at,
        user_id
      `)
      .eq('id', postId)
      .single()

    if (postError) {
      throw postError
    }

    if (!post) {
      throw new Error('Post no encontrado')
    }

    // Obtener perfil del usuario, contar comentarios y verificar like
    const [profileResult, commentsCount, userLike] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .eq('id', post.user_id)
        .single(),
      
      supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId),

      // Verificar si el usuario actual ha dado like
      userId ? supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single() : Promise.resolve({ data: null, error: null })
    ])

    const { data: profile, error: profileError } = profileResult
    const isLiked = userLike.data ? true : false

    if (profileError) {
      console.error('⚠️ Error obteniendo perfil:', profileError)
    }

    // Combinar datos
    const postWithData = {
      ...post,
      profiles: profile || null,
      comments_count: commentsCount.count || 0,
      views_count: post.views_count || 0,
      likes_count: post.likes_count || 0,
      is_liked: isLiked
    }

    return { success: true, data: postWithData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Obtener comentarios de un post
export const getPostComments = async (postId, userId = null) => {
  try {
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_comment_id,
        upvotes_count,
        downvotes_count,
        profiles:user_id (
          id,
          username,
          experience_points,
          team,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true })

    if (commentsError) {
      return { success: false, error: commentsError }
    }

    // Obtener respuestas para cada comentario
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            updated_at,
            user_id,
            post_id,
            parent_comment_id,
            upvotes_count,
            downvotes_count,
            profiles:user_id (
              id,
              username,
              experience_points,
              team,
              avatar_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true })

        if (repliesError) {
          console.error('⚠️ Error obteniendo respuestas:', repliesError)
        }

        return {
          ...comment,
          upvotes: comment.upvotes_count || 0,
          downvotes: comment.downvotes_count || 0,
          user_vote: null,
          replies: (replies || []).map(reply => ({
            ...reply,
            upvotes: reply.upvotes_count || 0,
            downvotes: reply.downvotes_count || 0,
            user_vote: null
          }))
        }
      })
    )

    return { success: true, data: commentsWithReplies }
  } catch (error) {
    return { success: false, error }
  }
}

// Obtener comentarios de un post
export const getCommentsByPost = async (postId) => {
  try {
    // Obtener comentarios básicos primero - SIN parent_id
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, post_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      throw commentsError
    }

    if (!comments || comments.length === 0) {
      return []
    }

    // Obtener los IDs únicos de usuarios
    const userIds = [...new Set(comments.map(comment => comment.user_id))]

    // Obtener perfiles de usuarios por separado
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, team')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
      // Continuar sin perfiles si hay error
    }

    // Combinar comentarios con perfiles
    const commentsWithProfiles = comments.map(comment => ({
      ...comment,
      profiles: profiles?.find(profile => profile.id === comment.user_id) || null
    }))

    return commentsWithProfiles
  } catch (error) {
    throw error
  }
}

// Crear un nuevo comentario
export const createComment = async (commentData) => {
  try {
    // Remover parent_id del commentData si existe, ya que la columna no existe en la DB
    const { parent_id, ...cleanCommentData } = commentData
    
    const { data, error } = await supabase
      .from('comments')
      .insert(cleanCommentData)
      .select(`
        id,
        content,
        created_at,
        user_id,
        post_id
      `)
      .single()

    if (error) {
      return { success: false, error }
    }

    // Obtener perfil del usuario por separado para evitar problemas de foreign key
    if (data && data.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, team')
        .eq('id', data.user_id)
        .single()

      // Combinar datos
      const commentWithProfile = {
        ...data,
        profiles: profile || null
      }

      return { success: true, data: commentWithProfile }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error }
  }
}

// Votar en un comentario - IMPLEMENTACIÓN SIMPLE SIN RAW
export const voteComment = async (commentId, userId, voteType) => {
  try {
    const field = voteType === 'up' ? 'upvotes_count' : 'downvotes_count'
    
    // Obtener valor actual primero
    const { data: currentComment } = await supabase
      .from('comments')
      .select(`${field}`)
      .eq('id', commentId)
      .single()

    const currentCount = currentComment?.[field] || 0
    
    // Actualizar con el valor incrementado
    const { data, error } = await supabase
      .from('comments')
      .update({ 
        [field]: currentCount + 1
      })
      .eq('id', commentId)
      .select('upvotes_count, downvotes_count')

    if (error) {
      return { success: false, error: error }
    }

    return { success: true, action: 'created', voteType, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Obtener feed de videos (solo posts con video_url)
export const getVideoFeed = async (limit = 20, offset = 0, startFromPostId = null) => {
  try {
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        video_url,
        views_count,
        likes_count,
        created_at,
        updated_at,
        user_id
      `)
      .not('video_url', 'is', null) // Solo posts con video
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Si se especifica un post inicial, obtener videos a partir de ahí
    if (startFromPostId) {
      // Primero obtener la fecha del post inicial
      const { data: startPost } = await supabase
        .from('posts')
        .select('created_at')
        .eq('id', startFromPostId)
        .single()

      if (startPost) {
        // Obtener videos desde ese post hacia atrás y hacia adelante
        query = supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            video_url,
            views_count,
            likes_count,
            created_at,
            updated_at,
            user_id
          `)
          .not('video_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit)
      }
    }

    const { data: videos, error: videosError } = await query

    if (videosError) {
      return { success: false, error: videosError }
    }

    if (!videos || videos.length === 0) {
      return { success: true, posts: [] }
    }

    // Obtener los IDs únicos de usuarios y posts
    const userIds = [...new Set(videos.map(video => video.user_id))]
    const postIds = videos.map(video => video.id)
    
    // Obtener perfiles de usuarios y conteo de comentarios
    const [profilesResult, commentsCountResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .in('id', userIds),
      
      // Contar comentarios por post
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .then(({ data }) => {
          const counts = {}
          data?.forEach(comment => {
            counts[comment.post_id] = (counts[comment.post_id] || 0) + 1
          })
          return counts
        })
    ])

    const { data: profiles, error: profilesError } = profilesResult

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    // Combinar videos con perfiles y datos de interacciones
    const videosWithData = videos.map(video => {
      const profile = profiles?.find(p => p.id === video.user_id)
      const commentsCount = commentsCountResult[video.id] || 0
      
      return {
        ...video,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: video.views_count || 0,
        likes_count: video.likes_count || 0,
        is_liked: false // Se actualizará cuando el usuario interactúe
      }
    })

    return { success: true, posts: videosWithData }
  } catch (error) {
    return { success: false, error }
  }
}