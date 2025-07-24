import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import ImageModal from './ImageModal'
import { likePost, dislikePost, addPostView } from '../services/posts'
import { applyVideoPreferences } from '../services/videoPreferences'
import { 
  MessageCircle, 
  ChartNoAxesColumn, 
  MoreHorizontal,
  Heart,
  ThumbsDown,
  Trash2,
  Edit,
  Flag,
  UserPlus,
  Loader2,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react'

// Variable global para controlar qué video está reproduciéndose
let currentPlayingVideo = null

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postData, setPostData] = useState(post)
  const [viewRegistered, setViewRegistered] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isVideoVisible, setIsVideoVisible] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true) // Empezar silenciado
  const [hasBeenUnmuted, setHasBeenUnmuted] = useState(false) // Controlar si ya fue desmuteado
  const [showControls, setShowControls] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const videoRef = useRef(null)
  const observerRef = useRef(null)

  // Registrar vista automáticamente cuando el post aparece en el feed
  useEffect(() => {
    if (!viewRegistered && postData.id && user?.id) {
      const registerView = async () => {
        try {
          const result = await addPostView(postData.id, user.id)
          if (result.success) {
            setViewRegistered(true)
            // Actualizar contador local de vistas
            setPostData(prev => ({
              ...prev,
              views_count: (prev.views_count || 0) + 1
            }))
          }
        } catch (error) {
          console.error('Error registrando vista automática:', error)
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
    const postUrl = `${window.location.origin}/post/${postData.id}`
    
    document.activeElement?.blur()
    
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('📋 ¡Enlace copiado!')
    }).catch((error) => {
      console.error('Error copiando:', error)
      prompt('Copia este enlace manualmente:', postUrl)
    })
  }

  const handleDelete = async () => {
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
    
    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    
    if (onDelete) {
      onDelete(postData.id).then(() => {
        window.showSuccessAlert('¡Post eliminado exitosamente!')
        setIsDeleting(false)
      }).catch((error) => {
        console.error('Error en eliminación:', error)
        window.showErrorAlert('Error al eliminar: ' + error.message)
        setIsDeleting(false)
      })
    } else {
      console.error('Función onDelete no está disponible')
      window.showErrorAlert('Función de eliminar no disponible')
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    document.activeElement?.blur()
    
    if (!isOwner) {
      alert('No puedes editar este post')
      return
    }
    
    alert('Función de editar en desarrollo. ¡Próximamente!')
  }

  const handleReport = () => {
    document.activeElement?.blur()
    alert('Función de reportar en desarrollo. ¡Gracias por tu feedback!')
  }

  const handleFollow = () => {
    document.activeElement?.blur()
    alert(`Función de seguir a @${postData.profiles?.username} en desarrollo.`)
  }

  const handleVote = async (voteType) => {
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para votar')
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      let result
      if (voteType === 1) {
        result = await likePost(postData.id, user.id)
      } else {
        result = await dislikePost(postData.id, user.id)
      }
      
      if (result.success) {
        const action = result.data?.action
        const oldVote = result.data?.old_vote
        const newVote = result.data?.new_vote || result.data?.vote_type

        // Actualizar estado local basado en la acción
        setPostData(prev => {
          let newLikes = prev.likes_count || 0
          let newDislikes = prev.dislikes_count || 0
          let newUserVote = 0

          if (action === 'created') {
            // Nuevo voto
            if (voteType === 1) {
              newLikes += 1
              newUserVote = 1
            } else {
              newDislikes += 1
              newUserVote = -1
            }
          } else if (action === 'removed') {
            // Voto eliminado (toggle off)
            if (voteType === 1) {
              newLikes = Math.max(0, newLikes - 1)
            } else {
              newDislikes = Math.max(0, newDislikes - 1)
            }
            newUserVote = 0
          } else if (action === 'updated') {
            // Voto cambiado
            if (oldVote === 1) newLikes = Math.max(0, newLikes - 1)
            if (oldVote === -1) newDislikes = Math.max(0, newDislikes - 1)
            
            if (newVote === 1) {
              newLikes += 1
              newUserVote = 1
            } else if (newVote === -1) {
              newDislikes += 1
              newUserVote = -1
            }
          }

          return {
            ...prev,
            likes_count: newLikes,
            dislikes_count: newDislikes,
            user_vote: newUserVote,
            is_liked: newUserVote === 1,
            is_disliked: newUserVote === -1
          }
        })
      } else {
        console.error('Error al votar:', result.error)
        window.showErrorAlert('Error al votar')
      }
    } catch (error) {
      console.error('Error en handleVote:', error)
      window.showErrorAlert('Error inesperado al votar')
    } finally {
      setIsLoading(false)
    }
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
        // Actualizar estado completo basado en la respuesta
        setPostData(prev => ({
          ...prev,
          likes_count: result.data.likes_count,
          dislikes_count: result.data.dislikes_count,
          is_liked: result.data.user_liked,
          is_disliked: result.data.user_disliked,
          user_vote: result.data.user_liked ? 1 : 0
        }))
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
        // Actualizar estado completo basado en la respuesta
        setPostData(prev => ({
          ...prev,
          likes_count: result.data.likes_count,
          dislikes_count: result.data.dislikes_count,
          is_liked: result.data.user_liked,
          is_disliked: result.data.user_disliked,
          user_vote: result.data.user_disliked ? -1 : 0
        }))
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

  const handlePostClick = () => {
    // La vista ya se registró automáticamente al renderizar el componente
  }

  // Intersection Observer para autoplay de videos
  useEffect(() => {
    if (postData.video_url && videoRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVideoVisible(true)
              // Pausar video que esté reproduciéndose actualmente
              if (currentPlayingVideo && currentPlayingVideo !== videoRef.current) {
                currentPlayingVideo.pause()
              }
              // Reproducir este video inmediatamente
              const video = videoRef.current
              if (video && entry.isIntersecting) {
                // Asegurar que esté muteado antes de reproducir
                video.muted = true
                setIsVideoMuted(true)
                
                // Reproducir inmediatamente con manejo silencioso de errores
                video.play().then(() => {
                  currentPlayingVideo = video
                  setIsVideoPlaying(true)
                  // Video iniciado exitosamente
                }).catch((error) => {
                  // Manejo completamente silencioso del error de autoplay
                  // Este error es normal y esperado en navegadores modernos
                  setIsVideoPlaying(false)
                  // No mostrar ningún log, es comportamiento normal del navegador
                })
              }
            } else {
              setIsVideoVisible(false)
              // Pausar video cuando sale del viewport
              if (videoRef.current) {
                videoRef.current.pause()
                setIsVideoPlaying(false)
                if (currentPlayingVideo === videoRef.current) {
                  currentPlayingVideo = null
                }
              }
            }
          })
        },
        {
          threshold: 0.6, // Aumentar threshold para mejor detección
          rootMargin: '-20px' // Pequeño margen para mejor control
        }
      )

      // Observar el video cuando esté disponible
      if (videoRef.current) {
        observerRef.current.observe(videoRef.current)
      }

      return () => {
        if (observerRef.current && videoRef.current) {
          observerRef.current.unobserve(videoRef.current)
        }
      }
    }
  }, [postData.video_url])

  // Limpiar observer al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      // Si este video se estaba reproduciendo, limpiar la referencia global
      if (currentPlayingVideo === videoRef.current) {
        currentPlayingVideo = null
      }
    }
  }, [])

  // Funciones de control de video
  const toggleVideoPlay = () => {
    const video = videoRef.current
    if (video) {
      if (video.paused) {
        // Pausar cualquier otro video que esté reproduciéndose
        if (currentPlayingVideo && currentPlayingVideo !== video) {
          currentPlayingVideo.pause()
        }
        video.play().then(() => {
          currentPlayingVideo = video
          setIsVideoPlaying(true)
        }).catch(console.error)
      } else {
        video.pause()
        setIsVideoPlaying(false)
        if (currentPlayingVideo === video) {
          currentPlayingVideo = null
        }
      }
    }
  }

  const toggleVideoMute = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const video = videoRef.current
    if (video) {
      // Asegurar que el video esté cargado antes de cambiar el volumen
      if (video.readyState >= 1) {
        const newMutedState = !video.muted
        video.muted = newMutedState
        setIsVideoMuted(newMutedState)
        
        // Forzar actualización visual
        setTimeout(() => {
          setIsVideoMuted(video.muted)
        }, 50)
      }
    }
  }

  const openVideoFullscreen = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const video = videoRef.current
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen()
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen()
      }
    }
  }

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current
    if (video && !isDragging) {
      setCurrentTime(video.currentTime)
    }
  }

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current
    if (video) {
      setVideoDuration(video.duration)
    }
  }

  const handleProgressClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const video = videoRef.current
    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const progressWidth = rect.width
    const clickRatio = clickX / progressWidth
    const newTime = clickRatio * videoDuration
    
    if (video && videoDuration > 0) {
      video.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleProgressMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    handleProgressClick(e)
    
    const handleMouseMove = (moveEvent) => {
      const video = videoRef.current
      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const clickX = moveEvent.clientX - rect.left
      const progressWidth = rect.width
      const clickRatio = Math.max(0, Math.min(1, clickX / progressWidth))
      const newTime = clickRatio * videoDuration
      
      if (video && videoDuration > 0) {
        video.currentTime = newTime
        setCurrentTime(newTime)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const formatVideoTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Manejar clic en video para móvil vs desktop
  const handleVideoClick = (e) => {
    // En móvil siempre navegar al formato TikTok
    const isMobile = window.innerWidth < 768
    if (isMobile && postData.video_url) {
      e.preventDefault()
      e.stopPropagation()
      navigate(`/video/${postData.id}`)
      return
    }

    // En desktop, solo interceptar el primer clic para desmutear
    if (isVideoMuted && !hasBeenUnmuted) {
      e.preventDefault()
      e.stopPropagation()
      
      const video = videoRef.current
      if (video) {
        video.muted = false
        setIsVideoMuted(false)
        setHasBeenUnmuted(true)
        console.log('🔊 Video desmuteado al hacer clic (comportamiento Twitter)')
      }
    }
    // Si ya fue desmuteado, permitir que los controles nativos funcionen normalmente
    // No hacer preventDefault ni stopPropagation
  }

  const handleImageClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowImageModal(true)
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

  // Aplicar preferencias de video al cargar
  useEffect(() => {
    // Aplicar preferencias de volumen cuando el video se carga
    if (videoRef.current) {
      const video = videoRef.current
      const handleLoadedMetadata = () => {
        applyVideoPreferences(video)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      // Si el video ya está cargado, aplicar inmediatamente
      if (video.readyState >= 1) {
        applyVideoPreferences(video)
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [postData.video_url])

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
        </div>
      </Link>

      {/* Imagen FUERA del Link para manejar clics independientemente */}
      {postData.image_url && (
        <div className="px-6 pb-3">
          <div className="mt-3 flex justify-center">
            <img 
              src={postData.image_url} 
              alt="Imagen del post" 
              className="max-w-full max-h-96 object-contain rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleImageClick}
              onError={(e) => {
                console.error('Error cargando imagen:', postData.image_url);
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Video FUERA del Link para manejar clics independientemente */}
      {postData.video_url && (
        <div className="px-6 pb-3">
          <div className="mt-3 relative group cursor-pointer overflow-hidden rounded-xl">
            <video 
              ref={videoRef}
              src={postData.video_url} 
              controls
              loop
              muted // Empezar muteado por defecto
              autoPlay={false} // Desactivar autoplay nativo del navegador
              playsInline
              preload="metadata"
              className="w-full h-auto object-contain bg-black border-2 border-black rounded-xl"
              style={{
                maxHeight: '500px', // Altura máxima como antes
                minHeight: '200px'   // Altura mínima para videos muy anchos
              }}
              onClick={handleVideoClick} // Manejar clics para mutear/desmutear o navegar
              onError={(e) => {
                console.error('Error cargando video:', postData.video_url);
                e.target.style.display = 'none';
              }}
              onLoadedMetadata={(e) => {
                handleVideoLoadedMetadata()
                const video = e.target
                video.muted = true // Asegurar que empiece muteado
                setIsVideoMuted(true)
                console.log('🔇 Video configurado para empezar muteado')
                applyVideoPreferences(video)
              }}
              onTimeUpdate={handleVideoTimeUpdate}
              onPause={() => {
                setIsVideoPlaying(false)
                if (currentPlayingVideo === videoRef.current) {
                  currentPlayingVideo = null
                }
              }}
              onPlay={() => {
                setIsVideoPlaying(true)
                // Pausar cualquier otro video que esté reproduciéndose
                if (currentPlayingVideo && currentPlayingVideo !== videoRef.current) {
                  currentPlayingVideo.pause()
                }
                currentPlayingVideo = videoRef.current
              }}
            >
              Tu navegador no soporta el elemento video.
            </video>

            {/* Barra de progreso personalizada */}
            {showControls && videoDuration > 0 && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleVideoPlay()
                    }}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isVideoPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  <button
                    onClick={toggleVideoMute}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isVideoMuted ? '🔇' : '🔊'}
                  </button>
                  
                  <button
                    onClick={openVideoFullscreen}
                    className="text-white hover:text-blue-400 transition-colors ml-auto"
                  >
                    ⛶
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xs min-w-[35px]">
                    {formatVideoTime(currentTime)}
                  </span>
                  
                  <div 
                    className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer relative"
                    onClick={handleProgressClick}
                    onMouseDown={handleProgressMouseDown}
                  >
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-150"
                      style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }}
                    />
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg transition-all duration-150"
                      style={{ 
                        left: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%`,
                        marginLeft: '-6px'
                      }}
                    />
                  </div>
                  
                  <span className="text-white text-xs min-w-[35px]">
                    {formatVideoTime(videoDuration)}
                  </span>
                </div>
              </div>
            )}

            {/* Indicador de mute/unmute para móvil */}
            <div className="md:hidden absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-white text-xs">
                  {isVideoMuted ? '🔇 Toca para activar sonido' : '🔊 Toca para silenciar'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones - Fuera del Link - DISEÑO DISTRIBUIDO DE PUNTA A PUNTA */}
      <div className="flex items-center justify-between px-6 pb-4">
        {/* Estadísticas distribuidas uniformemente */}
        <div className="flex items-center justify-between w-full max-w-2xl">
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
              postData.user_vote === 1
                ? 'text-red-500' 
                : 'text-base-content/60 hover:text-red-500'
            }`}
            onClick={handleLike}
            disabled={isLoading}
          >
            <div className={`p-2 rounded-full transition-colors ${
              postData.user_vote === 1
                ? '' 
                : 'group-hover:bg-red-50'
            }`}>
              <Heart className={`w-5 h-5 ${postData.user_vote === 1 ? 'fill-current' : ''}`} />
            </div>
            <span className="text-sm font-medium">{postData.likes_count || 0}</span>
            <span className="text-sm text-base-content/60 hidden sm:inline">Me gusta</span>
          </button>

          {/* No me gusta */}
          <button 
            className={`flex items-center space-x-2 transition-colors group ${
              postData.user_vote === -1
                ? 'text-blue-600' 
                : 'text-base-content/60 hover:text-blue-600'
            }`}
            onClick={handleDislike}
            disabled={isLoading}
          >
            <div className={`p-2 rounded-full transition-colors ${
              postData.user_vote === -1
                ? '' 
                : 'group-hover:bg-blue-50'
            }`}>
              <ThumbsDown className={`w-5 h-5 ${postData.user_vote === -1 ? 'fill-current' : ''}`} />
            </div>
            <span className="text-sm font-medium">{postData.dislikes_count || 0}</span>
            <span className="text-sm text-base-content/60 hidden sm:inline">No me gusta</span>
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