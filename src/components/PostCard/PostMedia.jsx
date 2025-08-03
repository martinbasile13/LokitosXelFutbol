import { useState, useEffect, useRef } from 'react'
import { Play, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ImageModal from '../Media/ImageModal'
import { applyVideoPreferences } from '../../services/videoPreferences'
import { useScrollRestore } from '../shared/hooks/useScrollPosition'

// Variable global para controlar qué video está reproduciéndose
let currentPlayingVideo = null

const PostMedia = ({ post, isReply = false }) => {
  const navigate = useNavigate()
  const { saveScrollPosition } = useScrollRestore()
  const [showImageModal, setShowImageModal] = useState(false)
  const [isVideoVisible, setIsVideoVisible] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [hasBeenUnmuted, setHasBeenUnmuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Estados para manejo de touch y prevención de clicks accidentales
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    startTime: 0,
    moved: false,
    isScrolling: false
  })
  
  const videoRef = useRef(null)
  const observerRef = useRef(null)
  const touchTimeoutRef = useRef(null)

  // Configuración de sensibilidad para touch
  const TOUCH_CONFIG = {
    MAX_TAP_DURATION: 200,    // Máximo tiempo para considerar tap
    MAX_TAP_MOVEMENT: 15,     // Máximo movimiento para considerar tap
    SCROLL_THRESHOLD: 10,     // Mínimo movimiento para detectar scroll
    CLICK_DELAY: 100          // Delay antes de ejecutar click
  }

  // Intersection Observer para autoplay de videos
  useEffect(() => {
    if (post.video_url && videoRef.current) {
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
                video.muted = true
                setIsVideoMuted(true)
                
                video.play().then(() => {
                  currentPlayingVideo = video
                  setIsVideoPlaying(true)
                }).catch(() => {
                  setIsVideoPlaying(false)
                })
              }
            } else {
              setIsVideoVisible(false)
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
          threshold: 0.6,
          rootMargin: '-20px'
        }
      )

      if (videoRef.current) {
        observerRef.current.observe(videoRef.current)
      }

      return () => {
        if (observerRef.current && videoRef.current) {
          observerRef.current.unobserve(videoRef.current)
        }
      }
    }
  }, [post.video_url])

  // Limpiar observer al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (currentPlayingVideo === videoRef.current) {
        currentPlayingVideo = null
      }
    }
  }, [])

  // Aplicar preferencias de video al cargar
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      const handleLoadedMetadata = () => {
        applyVideoPreferences(video)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      if (video.readyState >= 1) {
        applyVideoPreferences(video)
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [post.video_url])

  // Manejar tecla ESC para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showImageModal) {
        setShowImageModal(false)
      }
    }

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showImageModal])

  const handleImageClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowImageModal(true)
  }

  // Mejorado manejo de touch para videos
  const handleVideoTouchStart = (e) => {
    const touch = e.touches[0]
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      moved: false,
      isScrolling: false
    })

    // Limpiar timeout anterior si existe
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
  }

  const handleVideoTouchMove = (e) => {
    if (!e.touches[0]) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchState.startX)
    const deltaY = Math.abs(touch.clientY - touchState.startY)
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Detectar si se está scrolleando
    if (totalMovement > TOUCH_CONFIG.SCROLL_THRESHOLD) {
      setTouchState(prev => ({
        ...prev,
        moved: true,
        isScrolling: deltaY > deltaX // Es scroll vertical si Y > X
      }))
    }
  }

  const handleVideoTouchEnd = (e) => {
    const touchDuration = Date.now() - touchState.startTime
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchState.startX)
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchState.startY)
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Es un tap válido si:
    // 1. No se movió mucho
    // 2. Fue rápido
    // 3. No se detectó scroll
    const isValidTap = 
      totalMovement < TOUCH_CONFIG.MAX_TAP_MOVEMENT &&
      touchDuration < TOUCH_CONFIG.MAX_TAP_DURATION &&
      !touchState.isScrolling &&
      !touchState.moved

    console.log('🎯 Touch Analysis:', {
      movement: totalMovement,
      duration: touchDuration,
      isScrolling: touchState.isScrolling,
      moved: touchState.moved,
      isValidTap,
      postId: post.id
    })

    if (isValidTap) {
      // Agregar pequeño delay para asegurar que no es parte de un scroll
      touchTimeoutRef.current = setTimeout(() => {
        handleVideoClick(e)
      }, TOUCH_CONFIG.CLICK_DELAY)
    }

    // Reset touch state
    setTouchState({
      startX: 0,
      startY: 0,
      startTime: 0,
      moved: false,
      isScrolling: false
    })
  }

  const handleVideoClick = (e) => {
    console.log('🎬 Video click detectado:', {
      target: e.target?.tagName,
      currentTarget: e.currentTarget?.tagName,
      isMobile: window.innerWidth < 768,
      userAgent: navigator.userAgent,
      postId: post.id,
      hasVideoUrl: !!post.video_url,
      touchMoved: touchState.moved
    })
    
    const isMobile = window.innerWidth < 768
    
    // En móvil, SIEMPRE navegar al modo TikTok
    if (isMobile && post.video_url) {
      e.preventDefault()
      e.stopPropagation()
      
      // UNIFICAR: Guardar posición igual que los posts normales
      const currentPath = window.location.pathname
      saveScrollPosition(currentPath)
      console.log('💾 Guardando posición antes de navegar al VideoViewer')
      
      navigate(`/video/${post.id}`)
      return
    }

    // En desktop, manejar mute/unmute solo si no es móvil
    if (!isMobile && isVideoMuted && !hasBeenUnmuted) {
      e.preventDefault()
      e.stopPropagation()
      
      const video = videoRef.current
      if (video) {
        video.muted = false
        setIsVideoMuted(false)
        setHasBeenUnmuted(true)
      }
    }
  }

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current)
      }
    }
  }, [])

  const toggleVideoPlay = () => {
    const video = videoRef.current
    if (video) {
      if (video.paused) {
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
    if (video && video.readyState >= 1) {
      const newMutedState = !video.muted
      video.muted = newMutedState
      setIsVideoMuted(newMutedState)
      
      setTimeout(() => {
        setIsVideoMuted(video.muted)
      }, 50)
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

  return (
    <>
      {/* Imagen */}
      {post.image_url && (
        <div className={`px-6 pb-3 ${isReply ? 'px-4 pb-2' : ''}`}>
          <div className={`mt-3 flex justify-center ${isReply ? 'mt-2' : ''}`}>
            <img 
              src={post.image_url} 
              alt="Imagen del post" 
              className={`max-w-full object-contain rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity ${
                isReply ? 'max-h-48' : 'max-h-96'
              }`}
              onClick={handleImageClick}
              onError={(e) => {
                console.error('Error cargando imagen:', post.image_url);
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Video */}
      {post.video_url && (
        <div className={`px-6 pb-3 ${isReply ? 'px-4 pb-2' : ''}`}>
          {/* Wrapper que maneja touch events de manera inteligente */}
          <div 
            className={`mt-3 relative group cursor-pointer overflow-hidden rounded-xl ${isReply ? 'mt-2' : ''} select-none`}
            // Touch events para móvil con detección inteligente
            onTouchStart={handleVideoTouchStart}
            onTouchMove={handleVideoTouchMove}
            onTouchEnd={handleVideoTouchEnd}
            // Click para desktop
            onClick={window.innerWidth >= 768 ? handleVideoClick : undefined}
            style={{ 
              touchAction: 'pan-y', // Permitir solo scroll vertical
              WebkitTouchCallout: 'none', // Evitar menú contextual en iOS
              WebkitTapHighlightColor: 'transparent' // Quitar highlight azul
            }}
          >
            {/* Indicador visual de toque válido en móvil */}
            {window.innerWidth < 768 && (
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm opacity-0 group-active:opacity-100 transition-opacity duration-150">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Toca para ver en pantalla completa
                  </span>
                </div>
              </div>
            )}

            <video 
              ref={videoRef}
              src={post.video_url} 
              controls
              loop
              muted
              autoPlay={false}
              playsInline
              preload="metadata"
              className="w-full h-auto object-contain bg-black border-2 border-black rounded-xl pointer-events-none"
              style={{
                maxHeight: isReply ? '300px' : '500px',
                minHeight: isReply ? '150px' : '200px'
              }}
              onError={(e) => {
                console.error('Error cargando video:', post.video_url);
                e.target.style.display = 'none';
              }}
              onLoadedMetadata={(e) => {
                handleVideoLoadedMetadata()
                const video = e.target
                video.muted = true
                setIsVideoMuted(true)
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

      {/* Modal de imagen */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={post.image_url}
        alt="Imagen del post"
      />
    </>
  )
}

export default PostMedia