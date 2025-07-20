import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import ImageModal from './ImageModal'
import { useAuth } from '../context/AuthContext.jsx'
import { likePost, unlikePost, addPostView } from '../services/postService'
import { 
  MessageCircle, 
  ChartNoAxesColumn, 
  MoreHorizontal,
  Heart,
  Trash2,
  Edit,
  Flag,
  UserPlus,
  Loader2
} from 'lucide-react'

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postData, setPostData] = useState(post)
  const [viewRegistered, setViewRegistered] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  // Registrar vista automáticamente cuando el post aparece en el feed
  useEffect(() => {
    if (!viewRegistered && postData.id && user?.id) {
      const registerView = async () => {
        try {
          console.log('🎯 Registrando vista automática para post:', postData.id)
          const result = await addPostView(postData.id, user.id)
          console.log('📊 Resultado del registro de vista:', result)
          if (result.success) {
            console.log('✅ Vista registrada exitosamente')
            setViewRegistered(true)
            // Actualizar contador local de vistas
            setPostData(prev => ({
              ...prev,
              views_count: (prev.views_count || 0) + 1
            }))
          } else {
            console.error('❌ Error en registro de vista:', result.error)
          }
        } catch (error) {
          console.error('💥 Error registrando vista automática:', error)
        }
      }
      
      // Pequeño delay para evitar spam
      const timer = setTimeout(registerView, 500)
      return () => clearTimeout(timer)
    }
  }, [postData.id, user?.id, viewRegistered])
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }



  const truncateText = (text, maxLength) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const isOwner = user?.id === postData.user_id

  const handleCopyLink = () => {
    console.log('📋 Función copiar enlace iniciada')
    const postUrl = `${window.location.origin}/post/${postData.id}`
    console.log('📋 URL a copiar:', postUrl)
    
    document.activeElement?.blur()
    
    navigator.clipboard.writeText(postUrl).then(() => {
      console.log('✅ URL copiada exitosamente')
      alert('📋 ¡Enlace copiado!')
    }).catch((error) => {
      console.error('❌ Error copiando:', error)
      prompt('Copia este enlace manualmente:', postUrl)
    })
  }

  const handleDelete = async () => {
    console.log('🗑️ Función eliminar iniciada')
    console.log('🗑️ onDelete disponible:', !!onDelete)
    console.log('🗑️ Usuario actual:', user?.id)
    console.log('🗑️ Propietario del post:', postData.user_id)
    console.log('🗑️ Es propietario:', isOwner)
    
    document.activeElement?.blur()
    
    if (!isOwner) {
      window.showErrorAlert('No puedes eliminar este post')
      return
    }
    
    // Usar el modal de confirmación moderno
    const confirmed = await window.showConfirm({
      title: '¿Eliminar post?',
      message: 'Esta acción no se puede deshacer. El post se eliminará permanentemente.',
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    })
    
    console.log('🗑️ Confirmación del usuario:', confirmed)
    
    if (!confirmed) {
      console.log('❌ Usuario canceló eliminación')
      return
    }

    setIsDeleting(true)
    console.log('🔄 Iniciando eliminación...')
    
    if (onDelete) {
      console.log('🔄 Llamando función onDelete con ID:', postData.id)
      onDelete(postData.id).then(() => {
        console.log('✅ Eliminación completada')
        window.showSuccessAlert('¡Post eliminado exitosamente!')
        setIsDeleting(false)
      }).catch((error) => {
        console.error('❌ Error en eliminación:', error)
        window.showErrorAlert('Error al eliminar: ' + error.message)
        setIsDeleting(false)
      })
    } else {
      console.error('❌ Función onDelete no está disponible')
      window.showErrorAlert('Función de eliminar no disponible')
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    console.log('✏️ Función editar iniciada para post:', postData.id)
    console.log('✏️ Usuario:', user?.id, 'Propietario:', postData.user_id)
    
    document.activeElement?.blur()
    
    if (!isOwner) {
      alert('No puedes editar este post')
      return
    }
    
    alert('Función de editar en desarrollo. ¡Próximamente!')
  }

  const handleReport = () => {
    console.log('🚩 Función reportar iniciada para post:', postData.id)
    document.activeElement?.blur()
    alert('Función de reportar en desarrollo. ¡Gracias por tu feedback!')
  }

  const handleFollow = () => {
    console.log('👥 Función seguir iniciada para usuario:', postData.profiles?.username)
    document.activeElement?.blur()
    alert(`Función de seguir a @${postData.profiles?.username} en desarrollo.`)
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
      let result

      // Alternar me gusta
      if (postData.is_liked) {
        // Si ya le gusta, entonces es un unlike
        result = await unlikePost(postData.id, user.id)
        if (result.success) {
          setPostData(prev => ({
            ...prev,
            likes_count: Math.max(0, (prev.likes_count || 0) - 1),
            is_liked: false
          }))
        }
      } else {
        // Si no le gusta, entonces es un like
        result = await likePost(postData.id, user.id)
        if (result.success) {
          setPostData(prev => ({
            ...prev,
            likes_count: (prev.likes_count || 0) + 1,
            is_liked: true
          }))
        }
      }
      
      if (!result.success) {
        console.error('Error al dar me gusta:', result.error)
        if (result.error?.message && result.error.message.includes('Ya has dado like')) {
          // No mostrar error si ya tiene like, solo cambiar estado
          setPostData(prev => ({
            ...prev,
            is_liked: true
          }))
        } else {
          window.showErrorAlert('Error al dar me gusta')
        }
      }
    } catch (error) {
      console.error('Error en handleLike:', error)
      window.showErrorAlert('Error inesperado al dar me gusta')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostClick = () => {
    console.log('🔗 Navegando al post:', postData.id)
    // La vista ya se registró automáticamente al renderizar el componente
  }

  // Manejar tecla ESC para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showImageModal) {
        setShowImageModal(false)
      }
    }

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Evitar scroll del fondo
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showImageModal])

  return (
    <div className="block bg-base-100 border-b border-base-300 hover:shadow-md transition-shadow duration-200 relative">
      {/* Header */}
      <div className="flex items-start space-x-3 p-6 pb-3">
        <Link to={`/user/${postData.user_id}`}>
          <Avatar 
            src={postData.profiles?.avatar_url}
            alt={`Avatar de ${postData.profiles?.username}`}
            name={postData.profiles?.username || 'Usuario'}
            team={postData.profiles?.team} // Agregar equipo del usuario
            size="md"
            className="hover:scale-105 transition-transform cursor-pointer"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link 
              to={`/user/${postData.user_id}`}
              className="hover:underline"
            >
              <h3 className="font-bold truncate max-w-[8ch] sm:max-w-[12ch] md:max-w-[16ch]" title={postData.profiles?.username || 'Usuario'}>
                {truncateText(postData.profiles?.username || 'Usuario', 8)}
              </h3>
            </Link>
            <span className="text-base-content/50">·</span>
            <span className="text-base-content/50 text-sm">{formatTime(postData.created_at)}</span>
            {postData.profiles?.team && (
              <TeamBadge team={postData.profiles.team} size="sm" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              to={`/user/${postData.user_id}`}
              className="hover:underline"
            >
              <span className="text-base-content/70 text-sm truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[24ch]" title={`@${postData.profiles?.username || 'usuario'}`}>
                @{truncateText(postData.profiles?.username || 'usuario', 8)}
              </span>
            </Link>
            {postData.profiles?.team && (
              <>
                <span className="text-base-content/50">·</span>
                <span className="text-base-content/60 text-xs truncate max-w-[16ch] sm:max-w-[20ch] md:max-w-[32ch]" title={postData.profiles.team}>
                  {truncateText(postData.profiles.team, 20)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del post - Clickeable para navegar al post */}
      <Link 
        to={`/post/${postData.id}`}
        onClick={handlePostClick}
        className="block cursor-pointer px-6 pb-3"
      >
        {/* Contenido del post */}
        <div className="mt-3">
          <p className="text-base-content leading-relaxed break-words hyphens-auto whitespace-pre-wrap overflow-hidden">{postData.content}</p>
          
          {/* Mostrar imagen si existe - CON MODAL */}
          {postData.image_url && (
            <div className="mt-3 flex justify-center">
              <img 
                src={postData.image_url} 
                alt="Imagen del post" 
                className="max-w-full max-h-96 object-contain rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowImageModal(true)
                }}
                onError={(e) => {
                  console.error('Error cargando imagen:', postData.image_url);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Mostrar video si existe - CON PROPORCIONES ORIGINALES Y BORDES NEGROS */}
          {postData.video_url && (
            <div className="mt-3 flex justify-center bg-black rounded-lg">
              <video 
                src={postData.video_url} 
                controls 
                className="max-w-full max-h-96 object-contain rounded-lg"
                onError={(e) => {
                  console.error('Error cargando video:', postData.video_url);
                  e.target.style.display = 'none';
                }}
              >
                Tu navegador no soporta el elemento video.
              </video>
            </div>
          )}
        </div>
      </Link>

      {/* Acciones - Fuera del Link - DISEÑO DISTRIBUIDO DE PUNTA A PUNTA */}
      <div className="flex items-center justify-between px-6 pb-4">
        {/* Estadísticas distribuidas uniformemente */}
        <div className="flex items-center justify-between w-full max-w-md">
          {/* Comentarios */}
          <Link 
            to={`/post/${postData.id}`}
            className="flex items-center space-x-2 hover:text-blue-500 transition-colors group"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{postData.comments_count || 0}</span>
            <span className="text-sm text-base-content/60 hidden sm:inline">Comentarios</span>
          </Link>

          {/* Me gusta */}
          <button 
            className={`flex items-center space-x-2 transition-colors group ${
              postData.is_liked 
                ? 'text-red-500' 
                : 'text-base-content/60 hover:text-red-500'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleLike(e)
            }}
            disabled={isLoading}
          >
            <div className={`p-2 rounded-full transition-colors ${
              postData.is_liked 
                ? '' 
                : 'group-hover:bg-red-50'
            }`}>
              <Heart className={`w-5 h-5 ${postData.is_liked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-sm font-medium">{postData.likes_count || 0}</span>
            <span className="text-sm text-base-content/60 hidden sm:inline">Me gusta</span>
          </button>

          {/* Vistas */}
          <div className="flex items-center space-x-2 text-base-content/60">
            <div className="p-2 rounded-full">
              <ChartNoAxesColumn className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{postData.views_count || 0}</span>
            <span className="text-sm text-base-content/60 hidden sm:inline">Vistas</span>
          </div>
        </div>

        {/* Dropdown - Solo el botón de más opciones */}
        <div 
          className="dropdown dropdown-end ml-4"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreHorizontal className="w-5 h-5 text-base-content/60" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
            {/* Copiar enlace */}
            <li>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCopyLink()
                }}
                className="flex items-center gap-2 w-full text-left"
              >
                📋 Copiar enlace
              </button>
            </li>
            
            {isOwner ? (
              /* Opciones del propietario */
              <>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleEdit()
                    }}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <Edit className="w-4 h-4" />
                    Editar post
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete()
                    }}
                    disabled={isDeleting}
                    className={`flex items-center gap-2 w-full text-left text-error hover:bg-error hover:text-error-content ${isDeleting ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Eliminar post
                      </>
                    )}
                  </button>
                </li>
              </>
            ) : (
              /* Opciones para otros usuarios */
              <>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleFollow()
                    }}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <UserPlus className="w-4 h-4" />
                    Seguir a @{truncateText(postData.profiles?.username || 'usuario', 12)}
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleReport()
                    }}
                    className="flex items-center gap-2 w-full text-left text-warning"
                  >
                    <Flag className="w-4 h-4" />
                    Reportar post
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Modal de imagen */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={postData.image_url}
        alt="Imagen del post"
      />
    </div>
  )
}

export default PostCard