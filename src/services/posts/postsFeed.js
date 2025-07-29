// ===========================================
// POSTS FEED - OBTENER FEEDS Y POSTS CON DATOS
// ===========================================
// Responsabilidades:
// - Obtener feed principal de posts (SIN replies)
// - Obtener posts de un usuario específico (SIN replies)
// - Combinar posts con datos de usuarios e interacciones

import { supabase } from '../supabaseClient.js'

/**
 * Función auxiliar OPTIMIZADA para obtener conteo de replies (sin recursión)
 * @param {Array} postIds - IDs de posts principales
 * @returns {Promise<Object>} Objeto con conteos de replies por post
 */
const _getRepliesCount = async (postIds) => {
  try {
    if (!postIds || postIds.length === 0) {
      return {}
    }

    console.log('🔢 _getRepliesCount - contando replies directas para:', postIds.length, 'posts')

    // Solo contar replies directas (no recursivo) para mejor performance
    const { data: directReplies, error } = await supabase
      .from('posts')
      .select('parent_post_id')
      .in('parent_post_id', postIds)
      .eq('is_reply', true)
      .not('parent_post_id', 'is', null)

    if (error) {
      console.error('Error obteniendo conteo de replies:', error)
      return {}
    }

    // Contar replies por post
    const counts = {}
    
    // Inicializar todos los posts con 0 replies
    postIds.forEach(postId => {
      counts[postId] = 0
    })

    // Contar replies directas
    directReplies?.forEach(reply => {
      if (postIds.includes(reply.parent_post_id)) {
        counts[reply.parent_post_id] = (counts[reply.parent_post_id] || 0) + 1
      }
    })

    console.log('📊 Conteos de replies calculados:', counts)
    
    return counts
  } catch (error) {
    console.error('Error en _getRepliesCount:', error)
    return {}
  }
}

/**
 * Obtener posts del feed principal con todos los datos necesarios - SIN REPLIES
 * @param {number} limit - Límite de posts
 * @param {number} offset - Offset para paginación
 * @param {string|null} userId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Posts con datos completos (solo posts originales)
 */
export const getFeedPosts = async (limit = 20, offset = 0, userId = null) => {
  try {
    console.log('🏠 getFeedPosts - obteniendo feed SIN replies')
    
    // Obtener los posts básicos FILTRANDO REPLIES
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
        replies_count,
        created_at,
        updated_at,
        user_id,
        parent_post_id,
        is_reply
      `)
      .is('parent_post_id', null)  // Solo posts principales
      .eq('is_reply', false)       // Solo posts originales
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

    // Obtener perfiles, replies count y votos
    const [profilesResult, repliesCountResult, allLikesResult, allDislikesResult, userVotesResult] = await Promise.all([
      // Perfiles de usuarios
      supabase
        .from('profiles')
        .select('id, username, handle, experience_points, team, avatar_url')
        .in('id', userIds),
      
      // Contar replies por post
      _getRepliesCount(postIds),

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
      const repliesCount = repliesCountResult[post.id] || post.replies_count || 0
      const likesCount = likesCounts[post.id] || post.likes_count || 0
      const dislikesCount = dislikesCounts[post.id] || post.dislikes_count || 0
      const userVote = userVotesMap[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: repliesCount, // Mantener compatibilidad con sistema legacy
        replies_count: repliesCount,  // Nuevo campo para replies
        views_count: post.views_count || 0,
        likes_count: likesCount,
        dislikes_count: dislikesCount,
        user_vote: userVote,
        is_liked: userVote === 1,
        is_disliked: userVote === -1
      }
    })

    console.log('📊 Posts del feed obtenidos (sin replies):', postsWithData.length)
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getFeedPosts:', error)
    return []
  }
}

/**
 * Obtener posts de un usuario específico con datos completos - SIN REPLIES
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de posts
 * @param {number} offset - Offset para paginación
 * @param {string|null} currentUserId - ID del usuario actual (para votos)
 * @returns {Promise<Array>} Posts del usuario con datos completos (solo posts originales)
 */
export const getUserPosts = async (userId, limit = 20, offset = 0, currentUserId = null) => {
  try {
    console.log('🎯 getUserPosts - obteniendo posts SIN replies')
    
    // Obtener posts del usuario FILTRANDO REPLIES
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
        replies_count,
        created_at,
        updated_at,
        user_id,
        parent_post_id,
        is_reply
      `)
      .eq('user_id', userId)
      .is('parent_post_id', null)  // Solo posts principales
      .eq('is_reply', false)       // Solo posts originales
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

    // Obtener perfil del usuario y conteo de replies
    const [profileResult, repliesCountResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, handle, experience_points, team, avatar_url')
        .eq('id', userId)
        .single(),
      
      // Contar replies por post
      _getRepliesCount(postIds)
    ])

    const { data: profile, error: profileError } = profileResult

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
    }

    // Combinar posts con perfil e interacciones
    const postsWithData = posts.map(post => {
      const repliesCount = repliesCountResult[post.id] || post.replies_count || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: repliesCount, // Mantener compatibilidad
        replies_count: repliesCount,  // Nuevo campo
        views_count: post.views_count || 0,
        likes_count: post.likes_count || 0,
        dislikes_count: post.dislikes_count || 0,
        user_vote: 0,
        is_liked: false,
        is_disliked: false
      }
    })

    console.log('📊 Posts del usuario obtenidos (sin replies):', postsWithData.length)
    return postsWithData
  } catch (error) {
    console.error('💥 Error en getUserPosts:', error)
    return []
  }
}

/**
 * Enriquecer posts con datos de usuarios, replies y votos (función auxiliar)
 * @param {Array} posts - Posts básicos
 * @param {string|null} userId - ID del usuario actual
 * @returns {Promise<Array} Posts enriquecidos con datos completos
 */
export const getPostsWithUserData = async (posts, userId = null) => {
  try {
    if (!posts || posts.length === 0) {
      return []
    }

    // Obtener los IDs únicos de usuarios y posts
    const userIds = [...new Set(posts.map(post => post.user_id))]
    const postIds = posts.map(post => post.id)

    // Obtener perfiles, replies y votos en paralelo
    const [profilesResult, repliesCountResult, userVotesResult] = await Promise.all([
      // Perfiles de usuarios
      supabase
        .from('profiles')
        .select('id, username, handle, experience_points, team, avatar_url')
        .in('id', userIds),
      
      // Contar replies por post
      _getRepliesCount(postIds),

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
      const repliesCount = repliesCountResult[post.id] || post.replies_count || 0
      const userVote = userVotesMap[post.id] || 0
      
      return {
        ...post,
        profiles: profile || null,
        comments_count: repliesCount, // Mantener compatibilidad
        replies_count: repliesCount,  // Nuevo campo
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
      comments_count: post.replies_count || 0,
      replies_count: post.replies_count || 0,
      views_count: post.views_count || 0,
      likes_count: post.likes_count || 0,
      dislikes_count: post.dislikes_count || 0,
      user_vote: 0,
      is_liked: false,
      is_disliked: false
    }))
  }
}