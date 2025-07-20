import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import ImageModal from './ImageModal'
import { useAuth } from '../context/AuthContext.jsx'
import { votePost, addPostView, likePost, unlikePost } from '../services/postService'
import { 
  MessageCircle, 
  Heart, 
  ChartNoAxesColumn, 
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit,
  Flag,
  UserPlus,
  Loader2
} from 'lucide-react'

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postData, setPostData] = useState(post)
  const [viewRegistered, setViewRegistered] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  // Registrar vista automáticamente cuando el post aparece en el feed
  useEffect(() => {
    if (!viewRegistered && postData.id) {
      const registerView = async () => {
        try {
          console.log('🎯 Registrando vista automática para post:', postData.id)
          const result = await addPostView(postData.id, user?.id)
          console.log('📊 Resultado del registro de vista:', result)
          if (result.success) {
            console.log('✅ Vista registrada exitosamente')
            setViewRegistered(true)
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

  const handleDelete = () => {
    console.log('🗑️ Función eliminar iniciada')
    console.log('🗑️ onDelete disponible:', !!onDelete)
    console.log('🗑️ Usuario actual:', user?.id)
    console.log('🗑️ Propietario del post:', postData.user_id)
    console.log('🗑️ Es propietario:', isOwner)
    
    document.activeElement?.blur()
    
    if (!isOwner) {
      alert('No puedes eliminar este post')
      return
    }
    
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este post?')
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
        setIsDeleting(false)
      }).catch((error) => {
        console.error('❌ Error en eliminación:', error)
        alert('Error al eliminar: ' + error.message)
        setIsDeleting(false)
      })
    } else {
      console.error('❌ Función onDelete no está disponible')
      alert('Función de eliminar no disponible')
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

  const handleVote = async (voteType, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!user?.id) {
      alert('Debes iniciar sesión para votar')
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await votePost(postData.id, user.id, voteType)
      
      if (result.success) {
        setPostData(prev => {
          let newUpvotes = prev.upvotes || 0
          let newDownvotes = prev.downvotes || 0
          let newUserVote = prev.user_vote

          if (result.action === 'removed') {
            if (result.voteType === 'up') {
              newUpvotes = Math.max(0, newUpvotes - 1)
            } else {
              newDownvotes = Math.max(0, newDownvotes - 1)
            }
            newUserVote = null
          } else if (result.action === 'created') {
            if (result.voteType === 'up') {
              newUpvotes += 1
            } else {
              newDownvotes += 1
            }
            newUserVote = result.voteType
          } else if (result.action === 'changed') {
            if (result.previousVote === 'up') {
              newUpvotes = Math.max(0, newUpvotes - 1)
            } else {
              newDownvotes = Math.max(0, newDownvotes - 1)
            }
            
            if (result.voteType === 'up') {
              newUpvotes += 1
            } else {
              newDownvotes += 1
            }
            newUserVote = result.voteType
          }

          return {
            ...prev,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            user_vote: newUserVote
          }
        })
      } else {
        console.error('Error votando:', result.error)
        alert('Error al votar')
      }
    } catch (error) {
      console.error('Error en handleVote:', error)
      alert('Error inesperado al votar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!user?.id) {
      alert('Debes iniciar sesión para dar like')
      return
    }

    if (isLiking) return
    setIsLiking(true)

    try {
      if (postData.user_liked) {
        const result = await unlikePost(postData.id, user.id)
        
        if (result.success) {
          setPostData(prev => ({
            ...prev,
            user_liked: false,
            likes_count: Math.max(0, (prev.likes_count || 0) - 1)
          }))
        } else {
          console.error('Error quitando like:', result.error)
          alert('Error quitando like')
        }
      } else {
        const result = await likePost(postData.id, user.id)
        
        if (result.success) {
          setPostData(prev => ({
            ...prev,
            user_liked: true,
            likes_count: (prev.likes_count || 0) + 1
          }))
        } else {
          console.error('Error dando like:', result.error)
          if (result.code === 'SELF_LIKE') {
            alert('No puedes dar like a tus propios posts')
          } else if (result.code === 'ALREADY_LIKED') {
            setPostData(prev => ({ ...prev, user_liked: true }))
          } else {
            alert('Error dando like')
          }
        }
      }
    } catch (error) {
      console.error('Error en handleLike:', error)
      alert('Error inesperado al dar like')
    } finally {
      setIsLiking(false)
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

      {/* Acciones - Fuera del Link */}
      <div className="flex items-center justify-between px-6 pb-6">
        {/* Votaciones estilo Reddit */}
        <div className="flex items-center space-x-1">
          <button 
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 hover:scale-110 ${
              postData.user_vote === 'up' 
                ? 'text-orange-500 bg-orange-50' 
                : 'text-base-content/60 hover:text-orange-500 hover:bg-orange-50'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleVote('up', e)
            }}
            disabled={isLoading}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          
          {/* Puntuación neta estilo Reddit */}
          <div className={`px-2 py-1 rounded text-sm font-bold min-w-[3rem] text-center ${
            postData.user_vote === 'up' 
              ? 'text-orange-500' 
              : postData.user_vote === 'down' 
                ? 'text-blue-500' 
                : 'text-base-content/70'
          }`}>
            {(postData.upvotes || 0) - (postData.downvotes || 0)}
          </div>
          
          <button 
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 hover:scale-110 ${
              postData.user_vote === 'down' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-base-content/60 hover:text-blue-500 hover:bg-blue-50'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleVote('down', e)
            }}
            disabled={isLoading}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Otras acciones */}
        <div className="flex items-center space-x-4">
          {/* Comentarios - Ahora clickeable para ir al post */}
          <Link 
            to={`/post/${postData.id}`}
            className="flex items-center space-x-2 text-base-content/60 hover:text-primary transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{postData.comments_count || 0}</span>
          </Link>

          {/* Likes */}
          <button 
            className={`flex items-center space-x-2 transition-all duration-200 hover:scale-110 ${
              postData.user_liked 
                ? 'text-red-500' 
                : 'text-base-content/60 hover:text-red-500'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleLike(e)
            }}
            disabled={isLiking}
          >
            <Heart className={`w-5 h-5 ${postData.user_liked ? 'fill-current animate-pulse' : ''}`} />
            <span className="text-sm">{postData.likes_count || 0}</span>
          </button>

          {/* Views */}
          <div className="flex items-center space-x-2 text-base-content/60">
            <ChartNoAxesColumn className="w-5 h-5" />
            <span className="text-sm">{postData.views_count || 0}</span>
          </div>

          {/* Dropdown - Ahora completamente independiente */}
          <div 
            className="dropdown dropdown-end"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-circle btn-sm hover:scale-110 transition-transform duration-200"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
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