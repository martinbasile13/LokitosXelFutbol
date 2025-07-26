// ===========================================
// POSTS FEED - OBTENER FEEDS Y POSTS CON DATOS
// ===========================================
// Responsabilidades:
// - Obtener feed principal de posts
// - Obtener posts de un usuario específico
// - Combinar posts con datos de usuarios e interacciones

import { supabase } from '../supabaseClient.js'

/**
 * Función auxiliar para contar comentarios por post (uso interno)
 * @param {Array} postIds - IDs de posts
 * @returns {Promise<Object>} Objeto con conteos de comentarios por post
 */
const _getCommentsCount = async (postIds) => {
  try {
    if (!postIds || postIds.length === 0) {
      return {}
    }

    const { data: commentsCounts, error } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)

    if (error) {
      console.error('Error contando comentarios:', error)
      return {}
    }

    // Contar comentarios por post
    const counts = {}
    postIds.forEach(postId => {
      counts[postId] = 0
    })

    commentsCounts?.forEach(comment => {
      counts[comment.post_id] = (counts[comment.post_id] || 0) + 1
    })

    return counts
  } catch (error) {
    console.error('Error en _getCommentsCount:', error)
    return {}
  }
}

/**
 * Obtener posts del feed principal con todos los datos necesarios - USANDO IS_LIKE CORRECTAMENTE
 * @param {number} limit - Límite de posts
 * @param {number} offset - Offset para paginación
 * @param {string|null} userId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Posts con datos completos
 */
export const getFeedPosts = async (limit = 20, offset = 0, userId = null) => {
  try {
    console.log('🏠 getFeedPosts - obteniendo feed con sistema de likes/dislikes completo')
    
    // Obtener los posts básicos
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        views_count,
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

    // Obtener perfiles, comentarios y votos
    const [profilesResult, commentsCountResult, allLikesResult, allDislikesResult, userVotesResult] = await Promise.all([
      // Perfiles de usuarios
      supabase
        .from('profiles')
        .select('id, username, handle, experience_points, team, avatar_url')
        .in('id', userIds),
      
      // Contar comentarios por post
      _getCommentsCount(postIds),

      // Obtener TODOS los likes para estos posts
      supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_like', true),

      // Obtener TODOS los dislikes para estos posts
      supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_like', false),

      // Obtener votos del usuario actual si está autenticado
      userId ? supabase
        .from('post_likes')
        .select('post_id, is_like')
        .in('post_id', postIds)
        .eq('user_id', userId) : Promise.resolve({ data: [] })
    ])

    const { data: profiles, error: profilesError } = profilesResult
    const { data: allLikes, error: likesError } = allLikesResult
    const { data: allDislikes, error: dislikesError } = allDislikesResult
    const { data: userVotes, error: userVotesError } = userVotesResult

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    if (likesError) {
      console.error('Error obteniendo likes:', likesError)
    }

    if (dislikesError) {
      console.error('Error obteniendo dislikes:', dislikesError)
    }

    if (userVotesError) {
      console.error('Error obteniendo votos del usuario:', userVotesError)
    }

    // Contar likes y dislikes para cada post
    const likesCounts = {}
    const dislikesCounts = {}
    postIds.forEach(postId => {
      likesCounts[postId] = 0
      dislikesCounts[postId] = 0
    })

    // Contar likes totales
    allLikes?.forEach(like => {
      likesCounts[like.post_id] = (likesCounts[like.post_id] || 0) + 1
    })

    // Contar dislikes totales
    allDislikes?.forEach(dislike => {
      dislikesCounts[dislike.post_id] = (dislikesCounts[dislike.post_id] || 0) + 1
    })

    // Mapear votos del usuario
    const userVotesMap = {}
    userVotes?.forEach(vote => {
      userVotesMap[vote.post_id] = vote.is_like === true ? 1 : vote.is_like === false ? -1 : 0
    })

    // Combinar posts con perfiles y datos de interacciones
    const postsWithData = posts.map(post => {
      const profile = profiles?.find(p => p.id === post.user_id)
      const commentsCount = commentsCountResult[post.id] || 0
      const likesCount = likesCounts[post.id] || 0
      const dislikesCount = dislikesCounts[post.id] || 0
      const userVote = userVotesMap[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: likesCount,
        dislikes_count: dislikesCount,
        user_vote: userVote,
        is_liked: userVote === 1,
        is_disliked: userVote === -1
      }
    })

    console.log('📊 Posts obtenidos con sistema completo de likes/dislikes:', postsWithData.length)
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getFeedPosts:', error)
    return []
  }
}

/**
 * Obtener posts de un usuario específico con datos completos
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de posts
 * @param {number} offset - Offset para paginación
 * @param {string|null} currentUserId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Posts del usuario con datos completos
 */
export const getUserPosts = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    console.log('🎯 getUserPosts - obteniendo posts con sistema de likes y dislikes')
    
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
      console.error('Error obteniendo posts del usuario:', postsError)
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
        .select('id, username, handle, experience_points, team, avatar_url')
        .eq('id', userId)
        .single(),
      
      // Contar comentarios por post
      _getCommentsCount(postIds)
    ])

    const { data: profile, error: profileError } = profileResult

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
    }

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

    console.log('📊 Posts obtenidos con sistema de likes y dislikes:', postsWithData.length)
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getUserPosts:', error)
    return []
  }
}

/**
 * Enriquecer posts con datos de usuarios, comentarios y votos (función auxiliar)
 * @param {Array} posts - Posts básicos
 * @param {string|null} userId - ID del usuario actual
 * @returns {Promise<Array>} Posts enriquecidos con datos completos
 */
export const getPostsWithUserData = async (posts, userId = null) => {
  try {
    if (!posts || posts.length === 0) {
      return []
    }

    // Obtener los IDs únicos de usuarios y posts
    const userIds = [...new Set(posts.map(post => post.user_id))]
    const postIds = posts.map(post => post.id)

    // Obtener perfiles, comentarios y votos en paralelo
    const [profilesResult, commentsCountResult, userVotesResult] = await Promise.all([
      // Perfiles de usuarios
      supabase
        .from('profiles')
        .select('id, username, handle, experience_points, team, avatar_url')
        .in('id', userIds),
      
      // Contar comentarios por post
      _getCommentsCount(postIds),

      // Obtener votos del usuario actual si está autenticado
      userId ? supabase
        .from('post_likes')
        .select('post_id, is_like')
        .in('post_id', postIds)
        .eq('user_id', userId) : Promise.resolve({ data: [] })
    ])

    const { data: profiles, error: profilesError } = profilesResult
    const { data: userVotes, error: userVotesError } = userVotesResult

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
    }

    if (userVotesError) {
      console.error('Error obteniendo votos del usuario:', userVotesError)
    }

    // Mapear votos del usuario
    const userVotesMap = {}
    userVotes?.forEach(vote => {
      userVotesMap[vote.post_id] = vote.is_like === true ? 1 : vote.is_like === false ? -1 : 0
    })

    // Combinar posts con perfiles y datos de interacciones
    const postsWithData = posts.map(post => {
      const profile = profiles?.find(p => p.id === post.user_id)
      const commentsCount = commentsCountResult[post.id] || 0
      const userVote = userVotesMap[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: commentsCount,
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        dislikes_count: post.dislikes_count || 0,
        user_vote: userVote,
        is_liked: userVote === 1,
        is_disliked: userVote === -1
      }
    })

    return postsWithData
  } catch (error) {
    console.error('💥 Error en getPostsWithUserData:', error)
    return posts.map(post => ({
      ...post,
      profiles: null,
      comments_count: 0,
      views_count: post.views_count || 0,
      likes_count: post.likes_count || 0,
      dislikes_count: post.dislikes_count || 0,
      user_vote: 0,
      is_liked: false,
      is_disliked: false
    }))
  }
}