import { supabase } from './supabaseClient'

// Obtener posts del feed (ordenados por fecha) con datos de interacciones
export const getFeedPosts = async (limit = 20, offset = 0, userId = null) => {
  try {
    // Obtener los posts básicos CON LIKES_COUNT, DISLIKES_COUNT Y VIEWS_COUNT
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
        dislikes_count,
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

    // Combinar posts con perfiles y datos de interacciones
    const postsWithData = posts.map(post => {
      const profile = profiles?.find(p => p.id === post.user_id)
      const commentsCount = commentsCountResult[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        dislikes_count: post.dislikes_count || 0,
        user_vote: 0, // Los posts no tienen sistema de votos individual
        is_liked: false,
        is_disliked: false
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

// ================================
// FUNCIONES SIMPLIFICADAS PARA POSTS (SIN SISTEMA DE VOTOS)
// ================================

// Dar like a un post (incrementar contador directamente)
export const likePost = async (postId, userId) => {
  try {
    // Solo incrementar el contador de likes
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        likes_count: supabase.raw('likes_count + 1')
      })
      .eq('id', postId)
      .select('likes_count')

    if (error) {
      return { success: false, error }
    }

    return { 
      success: true, 
      data: { 
        action: 'liked',
        likes_count: data[0]?.likes_count || 0
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Dar dislike a un post (incrementar contador directamente)
export const dislikePost = async (postId, userId) => {
  try {
    // Solo incrementar el contador de dislikes
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        dislikes_count: supabase.raw('dislikes_count + 1')
      })
      .eq('id', postId)
      .select('dislikes_count')

    if (error) {
      return { success: false, error }
    }

    return { 
      success: true, 
      data: { 
        action: 'disliked',
        dislikes_count: data[0]?.dislikes_count || 0
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Obtener posts de un usuario específico
export const getUserPosts = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    // Obtener posts del usuario CON VIEWS_COUNT, LIKES_COUNT Y DISLIKES_COUNT
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
        dislikes_count,
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

    // Obtener perfil del usuario y conteo de comentarios
    const [profileResult, commentsCountResult] = await Promise.all([
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
        })
    ])

    const { data: profile, error: profileError } = profileResult

    // Combinar posts con perfil e interacciones
    const postsWithData = posts.map(post => {
      const commentsCount = commentsCountResult[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        dislikes_count: post.dislikes_count || 0,
        user_vote: 0,
        is_liked: false,
        is_disliked: false
      }
    })

    return postsWithData
  } catch (error) {
    return []
  }
}

// ================================
// FUNCIONES DE VIEWS
// ================================

// Registrar vista de un post
export const addPostView = async (postId, userId = null) => {
  try {
    if (!postId) {
      return { success: false, error: 'Post ID requerido' }
    }

    // Incrementar contador de vistas directamente
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        views_count: supabase.raw('views_count + 1')
      })
      .eq('id', postId)
      .select('views_count')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Obtener un post por ID
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
        dislikes_count,
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

    // Obtener perfil del usuario y contar comentarios
    const [profileResult, commentsCount] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, experience_points, team, avatar_url')
        .eq('id', post.user_id)
        .single(),
      
      supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
    ])

    const { data: profile, error: profileError } = profileResult

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
      dislikes_count: post.dislikes_count || 0,
      user_vote: 0,
      is_liked: false,
      is_disliked: false
    }

    return { success: true, data: postWithData }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ================================
// FUNCIONES DE COMENTARIOS
// ================================

// Obtener comentarios en estructura de árbol
export const getCommentsTree = async (postId, userId = null) => {
  try {
    if (!postId) {
      throw new Error('postId es requerido')
    }

    // Usar la función SQL para obtener comentarios en árbol
    const { data, error } = await supabase
      .rpc('get_comments_tree', {
        p_post_id: postId,
        p_user_id: userId
      })

    if (error) {
      throw error
    }

    // Obtener perfiles de usuarios para todos los comentarios
    const userIds = [...new Set(data.map(comment => comment.user_id))]
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, team')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    // Combinar comentarios con perfiles
    const commentsWithProfiles = data.map(comment => ({
      ...comment,
      profiles: profiles?.find(profile => profile.id === comment.user_id) || null,
      is_liked: comment.user_vote === 1,
      is_disliked: comment.user_vote === -1
    }))

    // Organizar en estructura de árbol
    const commentsMap = new Map()
    const rootComments = []

    // Crear mapa de comentarios
    commentsWithProfiles.forEach(comment => {
      comment.replies = []
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

// Crear un nuevo comentario con media
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
      return { success: false, error }
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
    return { success: false, error }
  }
}

// Eliminar un comentario
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

// ================================
// FUNCIONES DE LIKES/DISLIKES EN COMENTARIOS
// ================================

// Dar like a un comentario
export const likeComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { success: false, error: 'commentId y userId son requeridos' }
    }

    // Usar la función SQL para manejar el like (is_like = true)
    const { data, error } = await supabase
      .rpc('handle_comment_like', {
        p_comment_id: commentId,
        p_user_id: userId,
        p_is_like: true
      })

    if (error) {
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Dar dislike a un comentario
export const dislikeComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { success: false, error: 'commentId y userId son requeridos' }
    }

    // Usar la función SQL para manejar el dislike (is_like = false)
    const { data, error } = await supabase
      .rpc('handle_comment_like', {
        p_comment_id: commentId,
        p_user_id: userId,
        p_is_like: false
      })

    if (error) {
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Obtener voto del usuario en un comentario
export const getUserCommentVote = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { success: false, error: 'commentId y userId son requeridos' }
    }

    const { data, error } = await supabase
      .rpc('get_user_comment_like', {
        p_comment_id: commentId,
        p_user_id: userId
      })

    if (error) {
      return { success: false, error }
    }

    return { success: true, vote: data }
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
        dislikes_count,
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
            dislikes_count,
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
        dislikes_count: video.dislikes_count || 0,
        user_vote: 0,
        is_liked: false,
        is_disliked: false
      }
    })

    return { success: true, posts: videosWithData }
  } catch (error) {
    return { success: false, error }
  }
}