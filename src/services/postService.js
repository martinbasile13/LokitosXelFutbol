import { supabase } from './supabaseClient'

// Obtener posts del feed (ordenados por fecha) con datos de interacciones
export const getFeedPosts = async (limit = 20, offset = 0, userId = null) => {
  try {
    // Primero obtener los posts básicos
    const { data: posts, error: postsError } = await supabase
      .from('posts')
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
    
    // Obtener perfiles de usuarios, conteo de comentarios e interacciones en paralelo
    const [profilesResult, commentsCountResult, interactionsResult] = await Promise.all([
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
      
      // Obtener datos de interacciones (likes, views, votaciones)
      getPostsInteractions(postIds, userId)
    ])

    const { data: profiles, error: profilesError } = profilesResult

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    // Combinar posts con perfiles e interacciones
    const postsWithData = posts.map(post => {
      const profile = profiles?.find(p => p.id === post.user_id)
      const interactions = interactionsResult[post.id] || {
        likes_count: 0,
        views_count: 0,
        user_liked: false,
        upvotes: 0,
        downvotes: 0,
        user_vote: null
      }
      const commentsCount = commentsCountResult[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        ...interactions
      }
    })

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

    // Eliminar votes de comentarios relacionados ANTES de eliminar comentarios
    if (commentIds && commentIds.length > 0) {
      console.log('🧹 Eliminando votes de comentarios...')
      const { error: commentVotesError } = await supabase
        .from('comment_votes')
        .delete()
        .in('comment_id', commentIds.map(c => c.id))

      if (commentVotesError) {
        console.warn('⚠️ Error eliminando votes de comentarios:', commentVotesError)
      }
    }

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

    // Eliminar post votes
    console.log('🧹 Eliminando votes del post...')
    const { error: postVotesError } = await supabase
      .from('post_votes')
      .delete()
      .eq('post_id', postId)

    if (postVotesError) {
      console.warn('⚠️ Error eliminando votes del post:', postVotesError)
    }

    // Eliminar likes
    console.log('🧹 Eliminando likes del post...')
    const { error: likesError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)

    if (likesError) {
      console.warn('⚠️ Error eliminando likes:', likesError)
    }

    // Eliminar views
    console.log('🧹 Eliminando views del post...')
    const { error: viewsError } = await supabase
      .from('post_views')
      .delete()
      .eq('post_id', postId)

    if (viewsError) {
      console.warn('⚠️ Error eliminando views:', viewsError)
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

// Obtener posts de un usuario específico con datos de interacciones
export const getUserPosts = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    // Obtener posts del usuario
    const { data: posts, error: postsError } = await supabase
      .from('posts')
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
      
      // Obtener datos de interacciones (likes, views, votaciones)
      getPostsInteractions(postIds, currentUserId)
    ])

    const { data: profile, error: profileError } = profileResult

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
    }

    // Combinar posts con perfil e interacciones
    const postsWithData = posts.map(post => {
      const postInteractions = interactions[post.id] || {
        likes_count: 0,
        views_count: 0,
        user_liked: false,
        upvotes: 0,
        downvotes: 0,
        user_vote: null
      }
      
      const commentsCount = commentsCountResult[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
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

// Obtener datos de interacciones (likes, views, votaciones) para posts
export const getPostsInteractions = async (postIds, userId = null) => {
  try {
    console.log('🎯 getPostsInteractions:', { postIds, userId })

    if (!postIds || postIds.length === 0) {
      return {}
    }

    // Obtener likes de posts
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('post_id')
      .in('post_id', postIds)

    if (likesError) {
      console.error('❌ Error obteniendo likes:', likesError)
    }

    // Obtener views de posts
    const { data: views, error: viewsError } = await supabase
      .from('post_views')
      .select('post_id')
      .in('post_id', postIds)

    console.log('🔍 Views obtenidas:', { views, viewsError, postIds })

    if (viewsError) {
      console.error('❌ Error obteniendo views:', viewsError)
    }

    // Obtener votaciones de posts
    const [upvotesData, downvotesData] = await Promise.all([
      supabase
        .from('post_votes')
        .select('post_id')
        .eq('vote_type', 'up')
        .in('post_id', postIds),
      supabase
        .from('post_votes')
        .select('post_id')
        .eq('vote_type', 'down')
        .in('post_id', postIds)
    ])

    // Verificar votaciones del usuario si está logueado
    let userLikes = {}
    let userVotes = {}
    if (userId) {
      const { data: userLikesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)

      const { data: userVotesData } = await supabase
        .from('post_votes')
        .select('post_id, vote_type')
        .eq('user_id', userId)
        .in('post_id', postIds)

      userLikesData?.forEach(like => {
        userLikes[like.post_id] = true
      })

      userVotesData?.forEach(vote => {
        userVotes[vote.post_id] = vote.vote_type
      })
    }

    // Contar interactions por post
    const likesCount = {}
    const viewsCount = {}
    const upvotesCount = {}
    const downvotesCount = {}

    likes?.forEach(like => {
      likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1
    })

    views?.forEach(view => {
      viewsCount[view.post_id] = (viewsCount[view.post_id] || 0) + 1
    })

    console.log('🔢 Contadores calculados:', { likesCount, viewsCount, upvotesCount, downvotesCount })

    upvotesData.data?.forEach(vote => {
      upvotesCount[vote.post_id] = (upvotesCount[vote.post_id] || 0) + 1
    })

    downvotesData.data?.forEach(vote => {
      downvotesCount[vote.post_id] = (downvotesCount[vote.post_id] || 0) + 1
    })

    // Crear objeto resultado
    const result = {}
    postIds.forEach(postId => {
      result[postId] = {
        likes_count: likesCount[postId] || 0,
        views_count: viewsCount[postId] || 0,
        upvotes: upvotesCount[postId] || 0,
        downvotes: downvotesCount[postId] || 0,
        user_liked: userLikes[postId] || false,
        user_vote: userVotes[postId] || null
      }
    })

    console.log('✅ getPostsInteractions resultado:', result)
    return result
  } catch (error) {
    console.error('💥 Error en getPostsInteractions:', error)
    return {}
  }
}



// Dar like a un post
export const likePost = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: userId
      })
      .select()

    if (error) {
      // Si es error de duplicado, significa que ya le dio like
      if (error.code === '23505') {
        return { success: false, error: 'Ya le diste like a este post', code: 'ALREADY_LIKED' }
      }
      
      // Si es error de auto-like (trigger)
      if (error.message?.includes('No puedes dar like a tus propios posts')) {
        return { success: false, error: 'No puedes dar like a tus propios posts', code: 'SELF_LIKE' }
      }
      
      console.error('❌ Error dando like:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en likePost:', error)
    return { success: false, error: error.message }
  }
}

// Quitar like de un post
export const unlikePost = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('❌ Error quitando like:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en unlikePost:', error)
    return { success: false, error: error.message }
  }
}

// Registrar vista de un post
export const addPostView = async (postId, userId = null) => {
  try {
    console.log('🎯 addPostView llamada con:', { postId, userId })
    
    const { data, error } = await supabase
      .from('post_views')
      .insert({
        post_id: postId,
        user_id: userId
      })
      .select()

    console.log('📊 Respuesta de Supabase:', { data, error })

    if (error) {
      // Si es error de duplicado (ya vio el post), no es problema
      if (error.code === '23505') {
        console.log('ℹ️ Vista ya existía, todo OK')
        return { success: true, message: 'Vista ya registrada' }
      }
      
      console.error('❌ Error registrando vista:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Vista registrada exitosamente:', data)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en addPostView:', error)
    return { success: false, error: error.message }
  }
}

// Obtener estadísticas detalladas de un post
export const getPostStats = async (postId) => {
  try {
    const [likesResult, viewsResult] = await Promise.all([
      // Contar likes
      supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId),
      
      // Contar views (ya son únicas por constraint)
      supabase
        .from('post_views')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
    ])

    return {
      likes_count: likesResult.count || 0,
      views_count: viewsResult.count || 0
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas del post:', error)
    return { likes_count: 0, views_count: 0 }
  }
} 

// ================================
// FUNCIONES DE COMENTARIOS Y VOTACIONES REDDIT
// ================================

// Obtener un post individual con datos completos
export const getPostById = async (postId, userId = null) => {
  try {
    console.log('🎯 getPostById:', { postId, userId })

    // Obtener el post básico
    const { data: post, error: postError } = await supabase
      .from('posts')
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
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('❌ Error obteniendo post:', postError)
      return { success: false, error: postError }
    }

    if (!post) {
      return { success: false, error: 'Post no encontrado' }
    }

    // Obtener perfil del usuario del post
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .eq('id', post.user_id)
      .single()

    if (profileError) {
      console.error('⚠️ Error obteniendo perfil:', profileError)
    }

    // Obtener datos de interacciones
    const interactions = await getPostsInteractions([postId], userId)
    
    // Contar comentarios
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('post_id', postId)

    // Combinar todo
    const postWithData = {
      ...post,
      profiles: profile || null,
      comments_count: commentsCount || 0,
      ...interactions[postId]
    }

    return { success: true, data: postWithData }
  } catch (error) {
    console.error('💥 Error en getPostById:', error)
    return { success: false, error: error.message }
  }
}

// Obtener comentarios de un post con estructura anidada
export const getPostComments = async (postId, userId = null) => {
  try {
    console.log('🎯 getPostComments:', { postId, userId })

    // Obtener todos los comentarios del post
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_comment_id
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('❌ Error obteniendo comentarios:', commentsError)
      return { success: false, error: commentsError }
    }

    if (!comments || comments.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener perfiles de usuarios de comentarios
    const userIds = [...new Set(comments.map(c => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .in('id', userIds)

    // Obtener votos de comentarios si hay usuario
    let commentVotes = {}
    if (userId) {
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .eq('user_id', userId)
        .in('comment_id', comments.map(c => c.id))

      votes?.forEach(vote => {
        commentVotes[vote.comment_id] = vote.vote_type
      })
    }

    // Obtener contadores de votos para todos los comentarios
    const commentIds = comments.map(c => c.id)
    const [upvotesData, downvotesData] = await Promise.all([
      supabase
        .from('comment_votes')
        .select('comment_id')
        .eq('vote_type', 'up')
        .in('comment_id', commentIds),
      supabase
        .from('comment_votes')
        .select('comment_id')
        .eq('vote_type', 'down')
        .in('comment_id', commentIds)
    ])

    const upvotesCounts = {}
    const downvotesCounts = {}
    
    upvotesData.data?.forEach(vote => {
      upvotesCounts[vote.comment_id] = (upvotesCounts[vote.comment_id] || 0) + 1
    })
    
    downvotesData.data?.forEach(vote => {
      downvotesCounts[vote.comment_id] = (downvotesCounts[vote.comment_id] || 0) + 1
    })

    // Combinar comentarios con perfiles y votos
    const commentsWithData = comments.map(comment => {
      const profile = profiles?.find(p => p.id === comment.user_id)
      return {
        ...comment,
        profiles: profile || null,
        upvotes: upvotesCounts[comment.id] || 0,
        downvotes: downvotesCounts[comment.id] || 0,
        user_vote: commentVotes[comment.id] || null
      }
    })

    // Organizar comentarios en estructura anidada
    const topLevelComments = commentsWithData.filter(c => !c.parent_comment_id)
    const repliesMap = {}

    // Agrupar respuestas por comentario padre
    commentsWithData.forEach(comment => {
      if (comment.parent_comment_id) {
        if (!repliesMap[comment.parent_comment_id]) {
          repliesMap[comment.parent_comment_id] = []
        }
        repliesMap[comment.parent_comment_id].push(comment)
      }
    })

    // Agregar respuestas a comentarios principales
    const nestedComments = topLevelComments.map(comment => ({
      ...comment,
      replies: repliesMap[comment.id] || []
    }))

    return { success: true, data: nestedComments }
  } catch (error) {
    console.error('💥 Error en getPostComments:', error)
    return { success: false, error: error.message }
  }
}

// Crear un nuevo comentario
export const createComment = async (commentData) => {
  try {
    console.log('🎯 createComment:', commentData)

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        user_id: commentData.user_id,
        post_id: commentData.post_id,
        parent_comment_id: commentData.parent_comment_id || null,
        content: commentData.content
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_comment_id
      `)
      .single()

    if (commentError) {
      console.error('❌ Error creando comentario:', commentError)
      return { success: false, error: commentError }
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .eq('id', commentData.user_id)
      .single()

    const commentWithData = {
      ...comment,
      profiles: profile || null,
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
      replies: []
    }

    return { success: true, data: commentWithData }
  } catch (error) {
    console.error('💥 Error en createComment:', error)
    return { success: false, error: error.message }
  }
}

// Votar en un post
export const votePost = async (postId, userId, voteType) => {
  try {
    console.log('🎯 votePost iniciado:', { postId, userId, voteType })

    // Verificar si ya votó
    const { data: existingVote, error: selectError } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    console.log('🔍 Verificación de voto existente:', { existingVote, selectError })

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Quitar voto (ya votó lo mismo)
        console.log('🗑️ Eliminando voto existente...')
        const { error: deleteError } = await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        console.log('📊 Resultado eliminación:', { deleteError })

        if (deleteError) {
          console.error('❌ Error eliminando voto:', deleteError)
          return { success: false, error: deleteError }
        }

        console.log('✅ Voto eliminado exitosamente')
        return { success: true, action: 'removed', voteType }
      } else {
        // Cambiar voto
        console.log('🔄 Cambiando voto existente...')
        const { error: updateError } = await supabase
          .from('post_votes')
          .update({ vote_type: voteType })
          .eq('post_id', postId)
          .eq('user_id', userId)

        console.log('📊 Resultado actualización:', { updateError })

        if (updateError) {
          console.error('❌ Error cambiando voto:', updateError)
          return { success: false, error: updateError }
        }

        console.log('✅ Voto cambiado exitosamente')
        return { success: true, action: 'changed', voteType, previousVote: existingVote.vote_type }
      }
    } else {
      // Crear nuevo voto
      console.log('➕ Creando nuevo voto...')
      const { data: insertData, error: insertError } = await supabase
        .from('post_votes')
        .insert({
          post_id: postId,
          user_id: userId,
          vote_type: voteType
        })
        .select()

      console.log('📊 Resultado inserción:', { insertData, insertError })

      if (insertError) {
        console.error('❌ Error creando voto:', insertError)
        return { success: false, error: insertError }
      }

      console.log('✅ Nuevo voto creado exitosamente:', insertData)
      return { success: true, action: 'created', voteType }
    }
  } catch (error) {
    console.error('💥 Error en votePost:', error)
    return { success: false, error: error.message }
  }
}

// Votar en un comentario
export const voteComment = async (commentId, userId, voteType) => {
  try {
    console.log('🎯 voteComment:', { commentId, userId, voteType })

    // Verificar si ya votó
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Quitar voto
        const { error: deleteError } = await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)

        if (deleteError) {
          return { success: false, error: deleteError }
        }

        return { success: true, action: 'removed', voteType }
      } else {
        // Cambiar voto
        const { error: updateError } = await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('comment_id', commentId)
          .eq('user_id', userId)

        if (updateError) {
          return { success: false, error: updateError }
        }

        return { success: true, action: 'changed', voteType, previousVote: existingVote.vote_type }
      }
    } else {
      // Crear nuevo voto
      const { error: insertError } = await supabase
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          vote_type: voteType
        })

      if (insertError) {
        return { success: false, error: insertError }
      }

      return { success: true, action: 'created', voteType }
    }
  } catch (error) {
    console.error('💥 Error en voteComment:', error)
    return { success: false, error: error.message }
  }
} 