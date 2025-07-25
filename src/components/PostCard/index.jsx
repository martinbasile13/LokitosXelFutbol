import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import PostMedia from './PostMedia'
import PostActions from './PostActions'
import { likePost, dislikePost, addPostView } from '../../services/posts'

const PostCard = ({ post, onDelete, onVoteUpdate, onViewUpdate }) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postData, setPostData] = useState(post)
  const [viewRegistered, setViewRegistered] = useState(false)
  const [renderKey, setRenderKey] = useState(0) // ✅ Agregar key para forzar re-render

  // Registrar vista automáticamente cuando el post aparece en el feed
  useEffect(() => {
    if (!viewRegistered && postData.id && user?.id) {
      const registerView = async () => {
        try {
          const result = await addPostView(postData.id, user.id)
          if (result.success) {
            setViewRegistered(true)
            const newViewCount = (postData.views_count || 0) + 1
            setPostData(prev => ({
              ...prev,
              views_count: newViewCount
            }))
            
            // Notificar al componente padre si existe la función
            if (onViewUpdate) {
              onViewUpdate(postData.id, newViewCount)
            }
          }
        } catch (error) {
          console.error('Error registrando vista automática:', error)
        }
      }
      
      const timer = setTimeout(registerView, 500)
      return () => clearTimeout(timer)
    }
  }, [postData.id, user?.id, viewRegistered, onViewUpdate, postData.views_count]) // Agregar dependencias faltantes

  const handlePostClick = () => {
    // La vista ya se registró automáticamente al renderizar el componente
  }

  const handleEdit = () => {
    document.activeElement?.blur()
    
    if (user?.id !== postData.user_id) {
      window.showErrorAlert('No puedes editar este post')
      return
    }
    
    window.showInfoAlert('Función de editar en desarrollo. ¡Próximamente!')
  }

  const handleDelete = async () => {
    document.activeElement?.blur()
    
    if (user?.id !== postData.user_id) {
      window.showErrorAlert('No puedes eliminar este post')
      return
    }
    
    const confirmed = await window.showConfirm({
      title: '¿Eliminar post?',
      message: 'Esta acción no se puede deshacer. El post se eliminará permanentemente.',
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    })
    
    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    
    if (onDelete) {
      try {
        await onDelete(postData.id)
        window.showSuccessAlert('¡Post eliminado exitosamente!')
      } catch (error) {
        console.error('Error en eliminación:', error)
        window.showErrorAlert('Error al eliminar: ' + error.message)
      } finally {
        setIsDeleting(false)
      }
    } else {
      console.error('Función onDelete no está disponible')
      window.showErrorAlert('Función de eliminar no disponible')
      setIsDeleting(false)
    }
  }

  const handleFollow = () => {
    document.activeElement?.blur()
    window.showInfoAlert(`Función de seguir a @${postData.profiles?.username} en desarrollo.`)
  }

  const handleReport = () => {
    document.activeElement?.blur()
    window.showInfoAlert('Función de reportar en desarrollo. ¡Gracias por tu feedback!')
  }

  const handleLike = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar me gusta')
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await likePost(postData.id, user.id)
      
      if (result.success) {
        console.log('📊 Datos recibidos del backend:', result.data)
        
        const updatedPost = {
          ...postData,
          likes_count: result.data.likes_count,
          dislikes_count: result.data.dislikes_count,
          user_vote: result.data.user_vote, // ✅ Usar directamente el user_vote del backend
          is_liked: result.data.is_liked,
          is_disliked: result.data.is_disliked
        }
        
        console.log('🔄 Actualizando estado del post:', updatedPost)
        setPostData(updatedPost)
        
        // Notificar al componente padre si existe la función
        if (onVoteUpdate) {
          onVoteUpdate(postData.id, {
            likes_count: result.data.likes_count,
            dislikes_count: result.data.dislikes_count,
            user_vote: result.data.user_vote
          })
        }

        // Forzar re-renderizando el componente
        setRenderKey(prev => prev + 1)
      } else {
        console.error('Error al dar me gusta:', result.error)
        window.showErrorAlert('Error al dar me gusta')
      }
    } catch (error) {
      console.error('Error en handleLike:', error)
      window.showErrorAlert('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDislike = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar no me gusta')
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await dislikePost(postData.id, user.id)
      
      if (result.success) {
        console.log('📊 Datos recibidos del backend:', result.data)
        
        const updatedPost = {
          ...postData,
          likes_count: result.data.likes_count,
          dislikes_count: result.data.dislikes_count,
          user_vote: result.data.user_vote, // ✅ Usar directamente el user_vote del backend
          is_liked: result.data.is_liked,
          is_disliked: result.data.is_disliked
        }
        
        console.log('🔄 Actualizando estado del post:', updatedPost)
        setPostData(updatedPost)
        
        // Notificar al componente padre si existe la función
        if (onVoteUpdate) {
          onVoteUpdate(postData.id, {
            likes_count: result.data.likes_count,
            dislikes_count: result.data.dislikes_count,
            user_vote: result.data.user_vote
          })
        }

        // Forzar re-renderizando el componente
        setRenderKey(prev => prev + 1)
      } else {
        console.error('Error al dar no me gusta:', result.error)
        window.showErrorAlert('Error al dar no me gusta')
      }
    } catch (error) {
      console.error('Error en handleDislike:', error)
      window.showErrorAlert('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div key={renderKey} className="block bg-base-100 border-b border-base-300 hover:shadow-md transition-shadow duration-200 relative">
      <PostHeader 
        post={postData}
        user={user}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFollow={handleFollow}
        onReport={handleReport}
        isDeleting={isDeleting}
      />

      <PostContent 
        post={postData}
        onClick={handlePostClick}
      />

      <PostMedia 
        post={postData}
      />

      <PostActions 
        post={postData}
        user={user}
        isLoading={isLoading}
        onLike={handleLike}
        onDislike={handleDislike}
      />
    </div>
  )
}

export default PostCard