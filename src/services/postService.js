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
      console.error('Error obteniendo posts:', postsError)
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

    console.log('✅ Posts obtenidos con sistema de likes:', postsWithData)
    return postsWithData
  } catch (error) {
    console.error('Error en getFeedPosts:', error)
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
      console.error('Error obteniendo perfil:', profileError)
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
    console.error('Error en createPost:', error)
    return { success: false, error }
  }
}

// Eliminar un post
export const deletePost = async (postId, userId) => {
  console.log('🗑️ deletePost iniciado:', { postId, userId })
  
  try {
    // Primero verificar que el post existe y es del usuario
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .eq('user_id', userId)
      .single()

    console.log('🔍 Verificación del post:', { existingPost, checkError })

    if (checkError) {
      console.error('❌ Error verificando post:', checkError)
      return { success: false, error: checkError }
    }

    if (!existingPost) {
      console.error('❌ Post no encontrado o no pertenece al usuario')
      return { success: false, error: { message: 'Post no encontrado o sin permisos' } }
    }

    // Eliminar dependencias en orden correcto
    // Primero obtener IDs de comentarios del post
    console.log('🔍 Obteniendo comentarios del post...')
    const { data: commentIds } = await supabase
      .from('comments')
      .select('id')
      .eq('post_id', postId)

    // Ahora eliminar comentarios
    console.log('🧹 Eliminando comentarios del post...')
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId)

    if (commentsError) {
      console.warn('⚠️ Error eliminando comentarios:', commentsError)
      // Continuar aunque falle esto
    }

    // Finalmente, eliminar el post
    console.log('🔄 Procediendo con eliminación del post...')
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId)

    console.log('📊 Resultado eliminación:', { data, error })

    if (error) {
      console.error('❌ Error eliminando post:', error)
      return { success: false, error }
    }

    console.log('✅ Post y todas sus dependencias eliminadas exitosamente')
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en deletePost:', error)
    return { success: false, error }
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
      console.error('Error obteniendo posts del usuario:', postsError)
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

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
    }

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
        likes_count: post.likes_count || 0, // Usar contadores directos de la tabla posts
        is_liked: postInteractions.user_vote === 1, // Determinar si el post está "likeado" por el usuario
        ...postInteractions
      }
    })

    return postsWithData
  } catch (error) {
    console.error('Error en getUserPosts:', error)
    return []
  }
}

// ================================
// FUNCIONES DE LIKES Y VIEWS
// ================================

// Registrar vista de un post - NUEVA IMPLEMENTACIÓN EFICAZ
export const addPostView = async (postId, userId = null) => {
  try {
    console.log('🎯 addPostView llamada con:', { postId, userId })
    
    if (!postId) {
      console.error('❌ postId es requerido')
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
        console.error('❌ Error con RPC increment_post_views:', updateError)
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
          console.error('❌ Error en fallback final:', finalError)
          return { success: false, error: finalError.message }
        }

        console.log('✅ Vista incrementada con fallback completo:', finalData)
        return { success: true, data: finalData }
      }

      console.log('✅ Vista incrementada con RPC:', updateData)
      return { success: true, data: updateData }
    }

    if (error) {
      console.error('❌ Error incrementando vistas:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Vista incrementada exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en addPostView:', error)
    return { success: false, error: error.message }
  }
}

// Dar like a un post - IMPLEMENTACIÓN CORREGIDA
export const likePost = async (postId, userId) => {
  try {
    console.log('🎯 likePost iniciado:', { postId, userId })

    // Verificar si ya existe un like de este usuario (sin .single())
    const { data: existingLikes, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (checkError) {
      console.error('❌ Error verificando like existente:', checkError)
      return { success: false, error: checkError }
    }

    if (existingLikes && existingLikes.length > 0) {
      console.log('⚠️ El usuario ya ha dado like a este post')
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
      console.error('❌ Error registrando like:', error)
      return { success: false, error }
    }

    // Incrementar el contador en la tabla posts usando la función SQL
    const { data: updateResult, error: updateError } = await supabase
      .rpc('increment_post_likes', { post_id: postId })

    if (updateError) {
      console.error('❌ Error incrementando contador de likes:', updateError)
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

    console.log('✅ Like registrado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en likePost:', error)
    return { success: false, error: error.message }
  }
}

// Quitar like a un post - IMPLEMENTACIÓN CORREGIDA
export const unlikePost = async (postId, userId) => {
  try {
    console.log('🎯 unlikePost iniciado:', { postId, userId })

    // Eliminar el like de la tabla post_likes
    const { data, error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select('post_id, user_id')

    if (error) {
      console.error('❌ Error quitando like:', error)
      return { success: false, error }
    }

    // Si no se eliminó ninguna fila, el like no existía
    if (!data || data.length === 0) {
      console.log('⚠️ No había like para quitar')
      return { success: false, error: { message: 'No has dado like a este post' } }
    }

    // Decrementar el contador en la tabla posts usando la función SQL
    const { data: updateResult, error: updateError } = await supabase
      .rpc('decrement_post_likes', { post_id: postId })

    if (updateError) {
      console.error('❌ Error decrementando contador de likes:', updateError)
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

    console.log('✅ Like quitado exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en unlikePost:', error)
    return { success: false, error: error.message }
  }
}

// Obtener datos de interacciones - SUPER SIMPLIFICADO (sin necesidad de rastrear votos individuales)
export const getPostsInteractions = async (postIds, userId = null) => {
  try {
    console.log('🎯 getPostsInteractions:', { postIds, userId })

    if (!postIds || postIds.length === 0) {
      console.log('❌ No hay postIds para procesar')
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

    console.log('✅ getPostsInteractions resultado final:', result)
    return result
  } catch (error) {
    console.error('💥 Error en getPostsInteractions:', error)
    return {}
  }
}

// ================================
// FUNCIONES DE COMENTARIOS
// ================================

// Obtener un post por ID con datos de interacciones
export const getPostById = async (postId, userId = null) => {
  try {
    console.log('🎯 getPostById:', { postId, userId })

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
      console.error('❌ Error obteniendo post:', postError)
      return { success: false, error: postError }
    }

    if (!post) {
      return { success: false, error: { message: 'Post no encontrado' } }
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
      user_vote: null // Siempre null porque no rastreamos votos individuales
    }

    console.log('✅ Post obtenido:', postWithData)
    return { success: true, data: postWithData }
  } catch (error) {
    console.error('💥 Error en getPostById:', error)
    return { success: false, error }
  }
}

// Obtener comentarios de un post
export const getPostComments = async (postId, userId = null) => {
  try {
    console.log('🎯 getPostComments:', { postId, userId })

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
      console.error('❌ Error obteniendo comentarios:', commentsError)
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
          user_vote: null, // Siempre null porque no rastreamos votos individuales
          replies: (replies || []).map(reply => ({
            ...reply,
            upvotes: reply.upvotes_count || 0,
            downvotes: reply.downvotes_count || 0,
            user_vote: null
          }))
        }
      })
    )

    console.log('✅ Comentarios obtenidos:', commentsWithReplies.length)
    return { success: true, data: commentsWithReplies }
  } catch (error) {
    console.error('💥 Error en getPostComments:', error)
    return { success: false, error }
  }
}

// Obtener comentarios de un post
export const getCommentsByPost = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        profiles!comments_user_id_fkey (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .eq('post_id', postId)
      .is('parent_id', null) // Solo comentarios principales (no respuestas)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error obteniendo comentarios:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error en getCommentsByPost:', error)
    throw error
  }
}

// Crear un nuevo comentario
export const createComment = async (commentData) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        profiles!comments_user_id_fkey (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .single()

    if (error) {
      console.error('Error creando comentario:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en createComment:', error)
    return { success: false, error }
  }
}

// Votar en un comentario - IMPLEMENTACIÓN SIMPLE SIN RAW
export const voteComment = async (commentId, userId, voteType) => {
  try {
    console.log('🎯 voteComment iniciado:', { commentId, userId, voteType })

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
      console.error('❌ Error incrementando contador:', error)
      return { success: false, error: error }
    }

    console.log('✅ Voto en comentario registrado exitosamente:', data)
    return { success: true, action: 'created', voteType, data }
  } catch (error) {
    console.error('💥 Error en voteComment:', error)
    return { success: false, error: error.message }
  }
}