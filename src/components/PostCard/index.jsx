import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useScrollRestore } from '../shared/hooks/useScrollPosition'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import PostMedia from './PostMedia'
import PostActions from './PostActions'
import PostDropdown from './PostDropdown'
import Avatar from '../UI/Avatar'
import TeamBadge from '../UI/TeamBadge'
import { likePost, dislikePost, addPostView } from '../../services/posts'

const PostCard = ({ 
  post, 
  onDelete, 
  onVoteUpdate, 
  onViewUpdate, 
  isReply = false,
  replyLevel = 0,
  showConnector = false
}) => {
  const { user } = useAuth()
  const { saveScrollPosition } = useScrollRestore()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postData, setPostData] = useState(post)
  const [viewRegistered, setViewRegistered] = useState(false)

  // Actualizar postData cuando el prop post cambie
  useEffect(() => {
    setPostData(post)
  }, [post])

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
    // Esta función la maneja PostActions directamente
    // Mantenemos solo para compatibilidad
  }

  const handleDislike = async (event) => {
    // Esta función la maneja PostActions directamente
    // Mantenemos solo para compatibilidad
  }

  // Manejar click en toda la tarjeta
  const handleCardClick = (e) => {
    // Guardar posición del scroll antes de navegar
    const currentPath = window.location.pathname
    saveScrollPosition(currentPath)
    console.log('💾 Guardando posición antes de navegar a post detail')
  }

  // Calcular margen izquierdo para replies anidadas
  const getReplyMargin = () => {
    if (!isReply) return ''
    
    // Máximo 3 niveles de anidación con incremento de 40px cada nivel
    const level = Math.min(replyLevel, 3)
    return `ml-${level * 10}` // Tailwind: ml-10, ml-20, ml-30
  }

  // Clases de styling para replies
  const getReplyClasses = () => {
    if (!isReply) return ''
    
    return `
      border-l-2 border-blue-200 
      ${replyLevel > 0 ? 'bg-blue-50/30' : ''}
      ${replyLevel > 1 ? 'bg-blue-50/50' : ''}
      ${replyLevel > 2 ? 'bg-blue-50/70' : ''}
    `.trim()
  }

  return (
    <div 
      data-post-id={postData.id}
      className={`
        relative bg-base-100 border-b border-base-300 hover:shadow-md transition-shadow duration-200
        ${getReplyMargin()}
        ${getReplyClasses()}
        ${isReply ? 'border-l-2 border-blue-200' : ''}
      `}
    >
      {/* Conector visual para replies */}
      {showConnector && isReply && (
        <div className="absolute -left-2 top-0 w-4 h-6 border-l-2 border-b-2 border-blue-200 rounded-bl-lg"></div>
      )}

      {/* Link que envuelve toda la tarjeta EXCEPTO las acciones y dropdown */}
      <Link 
        to={`/post/${postData.id}`}
        onClick={handleCardClick}
        className="block cursor-pointer"
      >
        <PostHeader 
          post={postData}
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFollow={handleFollow}
          onReport={handleReport}
          isDeleting={isDeleting}
          isReply={isReply}
          disableNavigation={true}
          hideDropdown={true}
        />

        <PostContent 
          post={postData}
          onClick={handlePostClick}
          isReply={isReply}
          disableNavigation={true}
        />

        <PostMedia 
          post={postData}
          isReply={isReply}
        />
      </Link>

      {/* PostDropdown FUERA del Link */}
      <div className={`absolute ${isReply ? 'top-4 right-4' : 'top-6 right-6'}`} onClick={(e) => e.stopPropagation()}>
        <PostDropdown 
          post={postData}
          isOwner={user?.id === postData.user_id}
          isDeleting={isDeleting}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFollow={handleFollow}
          onReport={handleReport}
        />
      </div>

      {/* Acciones FUERA del Link para que funcionen independientemente */}
      <div onClick={(e) => e.stopPropagation()}>
        <PostActions 
          post={postData}
          user={user}
          isLoading={isLoading}
          onLike={handleLike}
          onDislike={handleDislike}
          isReply={isReply}
        />
      </div>
    </div>
  )
}

export default PostCard