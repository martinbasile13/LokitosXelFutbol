// ===========================================
// POSTS REPLIES API - COMENTARIOS COMO POSTS
// ===========================================
// Sistema de comentarios donde cada comentario es un post con parent_post_id
// Estilo Twitter/X - cada reply es un post completo con todas las funcionalidades
// Responsabilidades:
// - Crear replies (comentarios como posts)
// - Obtener replies de un post con threading
// - Obtener thread completo de conversación

import { supabase } from '../supabaseClient.js'

/**
 * Crear una reply (comentario como post)
 * @param {string} parentPostId - ID del post padre
 * @param {string} content - Contenido de la reply
 * @param {string} userId - ID del usuario que crea la reply
 * @param {Array} mediaUrls - URLs de media (imágenes/videos)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createReply = async (parentPostId, content, userId, mediaUrls = []) => {
  try {
    // Validar parámetros básicos
    if (!parentPostId || !userId) {
      console.error('❌ [DEBUG] Faltan parámetros requeridos:', { parentPostId, content, userId })
      return { success: false, error: 'parentPostId y userId son requeridos' }
    }

    // Validar que haya contenido O media
    if (!content?.trim() && (!mediaUrls || mediaUrls.length === 0)) {
      console.error('❌ [DEBUG] No hay contenido ni media:', { content, mediaUrls })
      return { success: false, error: 'Debes escribir algo o agregar una imagen/video' }
    }

    console.log('💬 [DEBUG] Iniciando createReply:', { 
      parentPostId, 
      userId, 
      content: content?.substring(0, 50) + '...' || 'Sin texto',
      mediaUrls 
    })

    // 1. Verificar que el post padre existe
    console.log('🔍 [DEBUG] Verificando post padre...')
    const { data: parentPost, error: parentError } = await supabase
      .from('posts')
      .select('id, reply_level')
      .eq('id', parentPostId)
      .single()

    if (parentError) {
      console.error('❌ [DEBUG] Error obteniendo post padre:', parentError)
      return { success: false, error: `Post padre no encontrado: ${parentError.message}` }
    }

    if (!parentPost) {
      console.error('❌ [DEBUG] Post padre no existe')
      return { success: false, error: 'Post padre no encontrado' }
    }

    console.log('✅ [DEBUG] Post padre encontrado:', parentPost)

    // 2. Calcular el nivel de reply (máximo 3 niveles)
    const replyLevel = Math.min((parentPost.reply_level || 0) + 1, 3)
    console.log('📊 [DEBUG] Reply level calculado:', replyLevel)

    // 3. Preparar datos del post-reply
    const postData = {
      title: null, // Las replies no tienen título
      content: content.trim(),
      user_id: userId,
      parent_post_id: parentPostId,
      reply_level: replyLevel,
      is_reply: true,
      image_url: mediaUrls.find(url => url.includes('image') || url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.webp')) || null,
      video_url: mediaUrls.find(url => url.includes('video') || url.includes('.mp4') || url.includes('.mov') || url.includes('.avi')) || null
    }

    console.log('📝 [DEBUG] Datos del post-reply a insertar:', postData)
    console.log('🖼️ [DEBUG] MediaUrls recibidas:', mediaUrls)
    console.log('📸 [DEBUG] image_url detectada:', postData.image_url)
    console.log('🎥 [DEBUG] video_url detectada:', postData.video_url)

    // 4. Crear el post-reply CON DEBUGGING DETALLADO
    console.log('💾 [DEBUG] Insertando en la base de datos...')
    const { data: newReply, error: createError } = await supabase
      .from('posts')
      .insert(postData)
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        created_at,
        updated_at,
        user_id,
        parent_post_id,
        reply_level,
        is_reply,
        views_count,
        likes_count,
        dislikes_count,
        replies_count
      `)
      .single()

    console.log('🔄 [DEBUG] Resultado del INSERT:', {
      error: createError,
      data: newReply
    })

    if (createError) {
      console.error('❌ [DEBUG] Error en el INSERT:', createError)
      return { success: false, error: createError.message }
    }

    if (!newReply) {
      console.error('❌ [DEBUG] No se devolvió data del INSERT')
      return { success: false, error: 'No se pudo crear la reply' }
    }

    console.log('✅ [DEBUG] Reply insertada exitosamente:', newReply)

    // 5. Verificar que se insertó realmente haciendo una query de verificación
    console.log('🔍 [DEBUG] Verificando que la reply se guardó...')
    const { data: verifyReply, error: verifyError } = await supabase
      .from('posts')
      .select('id, content, parent_post_id, is_reply')
      .eq('id', newReply.id)
      .single()

    if (verifyError) {
      console.error('⚠️ [DEBUG] Error verificando la reply:', verifyError)
    } else {
      console.log('✅ [DEBUG] Reply verificada en BD:', verifyReply)
    }

    // 6. Obtener perfil del usuario
    console.log('👤 [DEBUG] Obteniendo perfil del usuario...')
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, team')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('⚠️ [DEBUG] Error obteniendo perfil:', profileError)
    } else {
      console.log('✅ [DEBUG] Perfil obtenido:', userProfile)
    }

    // 7. Formatear respuesta con datos completos
    const replyWithProfile = {
      ...newReply,
      profiles: userProfile || null,
      user_vote: 0,
      is_liked: false,
      is_disliked: false,
      replies: []
    }

    console.log('🎉 [DEBUG] Reply creada exitosamente - respuesta final:', replyWithProfile)
    return { success: true, data: replyWithProfile }

  } catch (error) {
    console.error('💥 [DEBUG] Error inesperado en createReply:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener replies de un post con paginación
 * @param {string} postId - ID del post
 * @param {string} userId - ID del usuario actual (para votos)
 * @param {number} limit - Límite de replies por página
 * @param {number} offset - Offset para paginación
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getPostReplies = async (postId, userId = null, limit = 20, offset = 0) => {
  try {
    if (!postId) {
      return { success: false, error: 'postId es requerido' }
    }

    console.log('📋 Obteniendo replies del post:', { postId, limit, offset })

    // 1. Obtener replies directas (primer nivel)
    const { data: replies, error: repliesError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        video_url,
        created_at,
        updated_at,
        user_id,
        parent_post_id,
        reply_level,
        is_reply,
        views_count,
        likes_count,
        dislikes_count,
        replies_count,
        profiles!posts_user_id_fkey (
          id,
          username,
          avatar_url,
          team
        )
      `)
      .eq('parent_post_id', postId)
      .eq('is_reply', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (repliesError) {
      console.error('Error obteniendo replies:', repliesError)
      return { success: false, error: repliesError.message }
    }

    if (!replies || replies.length === 0) {
      return { success: true, data: [] }
    }

    // 2. Obtener votos del usuario si está autenticado
    let userVotes = []
    if (userId) {
      const replyIds = replies.map(reply => reply.id)
      const { data: votesData } = await supabase
        .from('post_likes')
        .select('post_id, is_like')
        .in('post_id', replyIds)
        .eq('user_id', userId)
      
      userVotes = votesData || []
    }

    // 3. Mapear votos del usuario
    const userVotesMap = {}
    userVotes.forEach(vote => {
      userVotesMap[vote.post_id] = vote.is_like === true ? 1 : vote.is_like === false ? -1 : 0
    })

    // 4. Formatear replies con datos de usuario y votos
    const formattedReplies = replies.map(reply => ({
      ...reply,
      user_vote: userVotesMap[reply.id] || 0,
      is_liked: userVotesMap[reply.id] === 1,
      is_disliked: userVotesMap[reply.id] === -1,
      replies: [] // Las sub-replies se cargan por separado
    }))

    console.log(`✅ ${formattedReplies.length} replies obtenidas`)
    return { success: true, data: formattedReplies }

  } catch (error) {
    console.error('💥 Error en getPostReplies:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtener thread completo de conversación (post + todas sus replies anidadas)
 * @param {string} postId - ID del post principal
 * @param {string} userId - ID del usuario actual (para votos)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getPostThread = async (postId, userId = null) => {
  try {
    if (!postId) {
      return { success: false, error: 'postId es requerido' }
    }

    console.log('🧵 [DEBUG] Iniciando getPostThread:', { postId, userId })

    // 1. PRIMERO: Verificar que el post existe de forma simple
    const { data: postExists, error: existsError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (existsError) {
      console.error('❌ [DEBUG] Error verificando existencia del post:', existsError)
      return { success: false, error: `Post no encontrado: ${existsError.message}` }
    }

    if (!postExists) {
      console.error('❌ [DEBUG] Post no existe en la base de datos:', postId)
      return { success: false, error: 'El post no existe' }
    }

    console.log('✅ [DEBUG] Post existe, obteniendo datos completos...')

    // 2. Obtener el post principal CON manejo de relaciones simplificado
    const { data: mainPost, error: mainPostError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        video_url,
        created_at,
        updated_at,
        user_id,
        parent_post_id,
        reply_level,
        is_reply,
        views_count,
        likes_count,
        dislikes_count,
        replies_count
      `)
      .eq('id', postId)
      .single()

    if (mainPostError) {
      console.error('❌ [DEBUG] Error obteniendo post principal:', mainPostError)
      return { success: false, error: `Error obteniendo post: ${mainPostError.message}` }
    }

    if (!mainPost) {
      console.error('❌ [DEBUG] Post principal no encontrado')
      return { success: false, error: 'Post principal no encontrado' }
    }

    console.log('✅ [DEBUG] Post principal obtenido:', mainPost)

    // 3. Obtener perfil del usuario del post principal por separado
    const { data: mainPostProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, team')
      .eq('id', mainPost.user_id)
      .single()

    if (profileError) {
      console.warn('⚠️ [DEBUG] No se pudo obtener perfil del usuario:', profileError)
    }

    console.log('👤 [DEBUG] Perfil del post principal:', mainPostProfile)

    // 4. Obtener TODAS las replies del thread - CON DEBUG DETALLADO Y QUERY SIMPLE
    console.log('🔍 [DEBUG] Buscando replies para postId:', postId)
    
    // PRIMERA QUERY: Simple para debuggear
    console.log('🔍 [DEBUG] Query SIMPLE para debuggear...')
    const { data: simpleReplies, error: simpleError } = await supabase
      .from('posts')
      .select('id, content, parent_post_id, is_reply, created_at')
      .eq('parent_post_id', postId)

    console.log('🔍 [DEBUG] Query SIMPLE resultado:', {
      error: simpleError,
      count: simpleReplies?.length || 0,
      data: simpleReplies
    })

    // SEGUNDA QUERY: Con todos los filtros
    const { data: allReplies, error: repliesError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        video_url,
        created_at,
        updated_at,
        user_id,
        parent_post_id,
        reply_level,
        is_reply,
        views_count,
        likes_count,
        dislikes_count,
        replies_count
      `)
      .eq('parent_post_id', postId)
      .eq('is_reply', true)
      .lte('reply_level', 3)
      .order('created_at', { ascending: true })

    console.log('📋 [DEBUG] Query COMPLETA de replies ejecutada:', {
      error: repliesError,
      repliesCount: allReplies?.length || 0,
      replies: allReplies
    })

    // TERCERA QUERY: Sin filtros para ver TODO
    console.log('🔍 [DEBUG] Query SIN FILTROS para ver TODO...')
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select('id, content, parent_post_id, is_reply, reply_level, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('🔍 [DEBUG] TODOS los posts recientes:', {
      error: allError,
      count: allPosts?.length || 0,
      data: allPosts
    })

    if (repliesError) {
      console.error('❌ [DEBUG] Error obteniendo replies:', repliesError)
      // No fallar completamente si no se pueden obtener replies
    }

    // 5. Obtener perfiles de usuarios de replies por separado
    let replyProfiles = []
    if (allReplies && allReplies.length > 0) {
      const replyUserIds = [...new Set(allReplies.map(reply => reply.user_id))]
      console.log('👥 [DEBUG] Obteniendo perfiles para userIds:', replyUserIds)
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, team')
        .in('id', replyUserIds)
      
      replyProfiles = profiles || []
      console.log('👥 [DEBUG] Perfiles obtenidos:', replyProfiles)
    }

    // 6. Obtener votos del usuario para post principal y replies
    let userVotes = []
    if (userId) {
      const allPostIds = [postId, ...(allReplies || []).map(reply => reply.id)]
      console.log('🗳️ [DEBUG] Obteniendo votos para postIds:', allPostIds)
      
      const { data: votesData } = await supabase
        .from('post_likes')
        .select('post_id, is_like')
        .in('post_id', allPostIds)
        .eq('user_id', userId)
      
      userVotes = votesData || []
      console.log('🗳️ [DEBUG] Votos obtenidos:', userVotes)
    }

    // 7. Mapear votos del usuario
    const userVotesMap = {}
    userVotes.forEach(vote => {
      userVotesMap[vote.post_id] = vote.is_like === true ? 1 : vote.is_like === false ? -1 : 0
    })

    // 8. Formatear post principal
    const formattedMainPost = {
      ...mainPost,
      profiles: mainPostProfile || null,
      user_vote: userVotesMap[mainPost.id] || 0,
      is_liked: userVotesMap[mainPost.id] === 1,
      is_disliked: userVotesMap[mainPost.id] === -1,
      replies: []
    }

    // 9. Formatear replies con perfiles Y datos del post padre
    const formattedReplies = (allReplies || []).map(reply => {
      const profile = replyProfiles.find(p => p.id === reply.user_id)
      
      // Buscar el perfil del autor del post padre para mostrar "Respondiendo a @username"
      let parentAuthorUsername = 'usuario'
      if (reply.parent_post_id === postId) {
        // Si responde al post principal, usar el perfil del post principal
        parentAuthorUsername = mainPostProfile?.username || 'usuario'
      } else {
        // Si responde a otra reply, buscar el autor de esa reply
        const parentReply = allReplies.find(r => r.id === reply.parent_post_id)
        if (parentReply) {
          const parentProfile = replyProfiles.find(p => p.id === parentReply.user_id)
          parentAuthorUsername = parentProfile?.username || 'usuario'
        }
      }
      
      return {
        ...reply,
        profiles: profile || null,
        parent_username: parentAuthorUsername, // Agregar el username del autor del post padre
        user_vote: userVotesMap[reply.id] || 0,
        is_liked: userVotesMap[reply.id] === 1,
        is_disliked: userVotesMap[reply.id] === -1,
        replies: []
      }
    })

    console.log('✨ [DEBUG] Replies formateadas:', formattedReplies)

    // 10. Organizar replies en estructura de árbol
    const repliesMap = new Map()
    const directReplies = []

    // Crear mapa de replies
    formattedReplies.forEach(reply => {
      repliesMap.set(reply.id, reply)
    })

    // Organizar jerarquía: replies que son directas al post principal
    formattedReplies.forEach(reply => {
      if (reply.parent_post_id === postId) {
        directReplies.push(reply)
      } else {
        // Es una sub-reply, buscar su padre
        const parent = repliesMap.get(reply.parent_post_id)
        if (parent) {
          parent.replies.push(reply)
        }
      }
    })

    // 11. Agregar replies al post principal
    formattedMainPost.replies = directReplies

    console.log(`✅ [DEBUG] Thread completo armado:`, {
      mainPost: formattedMainPost.id,
      directRepliesCount: directReplies.length,
      totalRepliesCount: formattedReplies.length,
      finalStructure: formattedMainPost
    })

    return { success: true, data: formattedMainPost }

  } catch (error) {
    console.error('💥 [DEBUG] Error en getPostThread:', error)
    return { success: false, error: `Error inesperado: ${error.message}` }
  }
}

/**
 * Obtener conteo de replies de un post
 * @param {string} postId - ID del post
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export const getPostRepliesCount = async (postId) => {
  try {
    if (!postId) {
      return { success: false, error: 'postId es requerido' }
    }

    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('parent_post_id', postId)
      .eq('is_reply', true)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Eliminar una reply (solo el autor puede eliminar)
 * @param {string} replyId - ID de la reply a eliminar
 * @param {string} userId - ID del usuario que elimina
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deleteReply = async (replyId, userId) => {
  try {
    if (!replyId || !userId) {
      return { success: false, error: 'replyId y userId son requeridos' }
    }

    // Verificar que la reply existe y pertenece al usuario
    const { data: existingReply, error: checkError } = await supabase
      .from('posts')
      .select('user_id, is_reply')
      .eq('id', replyId)
      .single()

    if (checkError || !existingReply) {
      return { success: false, error: 'Reply no encontrada' }
    }

    if (!existingReply.is_reply) {
      return { success: false, error: 'El post no es una reply' }
    }

    if (existingReply.user_id !== userId) {
      return { success: false, error: 'No tienes permisos para eliminar esta reply' }
    }

    // Eliminar la reply (los triggers de DB manejarán contadores)
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', replyId)
      .eq('user_id', userId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}