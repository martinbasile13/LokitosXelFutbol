import { supabase } from './supabaseClient'

// Obtener posts del feed (ordenados por fecha)
export const getFeedPosts = async (limit = 20, offset = 0) => {
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

    // Obtener los IDs únicos de usuarios
    const userIds = [...new Set(posts.map(post => post.user_id))]
    
    // Obtener perfiles de usuarios
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError)
      // Retornar posts sin perfiles si hay error
      return posts.map(post => ({
        ...post,
        profiles: null
      }))
    }

    // Combinar posts con perfiles
    const postsWithProfiles = posts.map(post => {
      const profile = profiles?.find(p => p.id === post.user_id)
      return {
        ...post,
        profiles: profile || null
      }
    })

    return postsWithProfiles
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
  try {
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error eliminando post:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en deletePost:', error)
    return { success: false, error }
  }
}

// Obtener posts de un usuario específico
export const getUserPosts = async (userId, limit = 20, offset = 0) => {
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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, experience_points, team, avatar_url')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
      // Retornar posts sin perfil si hay error
      return posts.map(post => ({
        ...post,
        profiles: null
      }))
    }

    // Combinar posts con perfil
    const postsWithProfile = posts.map(post => ({
      ...post,
      profiles: profile
    }))

    return postsWithProfile
  } catch (error) {
    console.error('Error en getUserPosts:', error)
    return []
  }
} 