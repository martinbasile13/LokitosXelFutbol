import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getVideoFeed, likePost, unlikePost, addPostView } from '../services/postService'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react'

const VideoViewer = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const containerRef = useRef(null)
  const videoRefs = useRef([])
  
  // Estados para scroll infinito inteligente
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const isLoadingRef = useRef(false)
  
  // Configuración del buffer inteligente
  const BUFFER_SIZE = 15 // Máximo de videos en memoria
  const LOAD_THRESHOLD = 3 // Cargar más cuando queden 3 videos por ver
  const CLEANUP_THRESHOLD = 20 // Limpiar cuando superamos 20 videos
  const VIDEOS_PER_LOAD = 5 // Cantidad de videos a cargar cada vez

  useEffect(() => {
    loadVideos()
  }, [postId])

  useEffect(() => {
    // Auto-play el video actual con delay
    const timer = setTimeout(() => {
      const currentVideo = videoRefs.current[currentIndex]
      if (currentVideo && isPlaying) {
        currentVideo.play().catch(console.error)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [currentIndex, isPlaying])

  const loadVideos = async () => {
    try {
      setLoading(true)
      isLoadingRef.current = true
      
      const result = await getVideoFeed(BUFFER_SIZE, 0, postId)
      if (result.success && result.posts.length > 0) {
        setVideos(result.posts)
        setCurrentOffset(BUFFER_SIZE)
        setHasMoreVideos(result.posts.length === BUFFER_SIZE)
        
        // Encontrar el índice del video inicial
        if (postId) {
          const index = result.posts.findIndex(video => video.id === parseInt(postId))
          setCurrentIndex(index >= 0 ? index : 0)
        }
      }
    } catch (error) {
      console.error('Error cargando videos:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  const loadMoreVideos = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreVideos) return
    
    try {
      setLoadingMore(true)
      isLoadingRef.current = true
      
      const result = await getVideoFeed(VIDEOS_PER_LOAD, currentOffset)
      
      if (!result.success || result.posts.length === 0) {
        setHasMoreVideos(false)
        return
      }

      const newVideos = result.posts

      setVideos(prevVideos => {
        const updatedVideos = [...prevVideos, ...newVideos]
        
        // Limpiar videos antiguos si superamos el threshold
        if (updatedVideos.length > CLEANUP_THRESHOLD) {
          const videosToRemove = updatedVideos.length - BUFFER_SIZE
          const cleanedVideos = updatedVideos.slice(videosToRemove)
          
          // Ajustar índice actual y offset
          const newCurrentIndex = Math.max(0, currentIndex - videosToRemove)
          setCurrentIndex(newCurrentIndex)
          setCurrentOffset(prev => prev + VIDEOS_PER_LOAD)
          
          // Limpiar referencias de videos antiguos
          videoRefs.current = videoRefs.current.slice(videosToRemove)
          
          return cleanedVideos
        }
        
        setCurrentOffset(prev => prev + VIDEOS_PER_LOAD)
        return updatedVideos
      })
      
      setHasMoreVideos(newVideos.length === VIDEOS_PER_LOAD)
      
    } catch (error) {
      console.error('Error cargando más videos:', error)
    } finally {
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [currentOffset, hasMoreVideos, currentIndex])

  const handleScroll = (e) => {
    const { scrollTop, clientHeight } = e.target
    const newIndex = Math.round(scrollTop / clientHeight)
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      // Pausar video anterior
      const prevVideo = videoRefs.current[currentIndex]
      if (prevVideo) {
        prevVideo.pause()
      }
      
      setCurrentIndex(newIndex)
      
      // Registrar vista
      if (user?.id && videos[newIndex]) {
        addPostView(videos[newIndex].id, user.id)
      }

      // Actualizar URL sin reemplazar historial
      window.history.replaceState(null, '', `/video/${videos[newIndex].id}`)
      
      // Cargar más videos cuando nos acercamos al final
      const remaining = videos.length - newIndex - 1
      if (remaining <= LOAD_THRESHOLD && hasMoreVideos && !isLoadingRef.current) {
        loadMoreVideos()
      }
    }
  }

  const handleLike = async (videoIndex) => {
    if (!user?.id) return
    
    const video = videos[videoIndex]
    const isLiked = video.is_liked

    try {
      const result = isLiked 
        ? await unlikePost(video.id, user.id)
        : await likePost(video.id, user.id)

      if (result.success) {
        setVideos(prev => prev.map((v, i) => 
          i === videoIndex 
            ? {
                ...v,
                is_liked: !isLiked,
                likes_count: isLiked 
                  ? Math.max(0, (v.likes_count || 0) - 1)
                  : (v.likes_count || 0) + 1
              }
            : v
        ))
      }
    } catch (error) {
      console.error('Error al dar like:', error)
    }
  }

  const togglePlay = () => {
    const currentVideo = videoRefs.current[currentIndex]
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause()
      } else {
        currentVideo.play().catch(console.error)
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.muted = !isMuted
      }
    })
    setIsMuted(!isMuted)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando videos...</p>
        </div>
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p>No hay videos disponibles</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-white/20 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 md:hidden">
      {/* Header fijo */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-2">
            {/* Indicador de posición y carga */}
            <div className="text-xs text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              {currentIndex + 1} de {videos.length}{hasMoreVideos ? '+' : ''}
            </div>
            
            <button 
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Container de videos con scroll snap mejorado */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          height: '100vh',
          height: '100dvh'
        }}
      >
        {videos.map((video, index) => (
          <div 
            key={`${video.id}-${index}`} // Key único para evitar problemas al limpiar
            className="relative w-full snap-start bg-black flex items-center justify-center"
            style={{ 
              height: '100vh',
              height: '100dvh'
            }}
          >
            {/* Video con adaptación automática según orientación */}
            <video
              ref={el => videoRefs.current[index] = el}
              src={video.video_url}
              className={`w-full h-full ${
                videoRefs.current[index]?.videoWidth > videoRefs.current[index]?.videoHeight 
                  ? 'object-contain'
                  : 'object-cover'
              }`}
              loop
              muted={isMuted}
              playsInline
              preload={Math.abs(index - currentIndex) <= 1 ? "auto" : "metadata"}
              onClick={togglePlay}
              onMouseEnter={(e) => {
                if (index === currentIndex) {
                  e.target.play().catch(console.error)
                  setIsPlaying(true)
                }
              }}
              onLoadedData={() => {
                if (index === currentIndex && isPlaying) {
                  videoRefs.current[index]?.play().catch(console.error)
                }
              }}
              onLoadedMetadata={(e) => {
                const video = e.target
                if (video.videoWidth && video.videoHeight) {
                  setVideos(prev => [...prev])
                }
              }}
              style={{
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />

            {/* Overlay de pausa */}
            {!isPlaying && index === currentIndex && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            )}

            {/* Información del post - Con más padding y altura segura */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
              {/* Gradient para legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>
              
              <div className="relative p-4 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
                <div className="flex justify-between items-end">
                  {/* Información izquierda */}
                  <div className="flex-1 mr-4">
                    {/* Usuario */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar 
                        src={video.profiles?.avatar_url}
                        alt={video.profiles?.username}
                        name={video.profiles?.username || 'Usuario'}
                        team={video.profiles?.team}
                        size="sm"
                      />
                      <span className="text-white font-semibold text-shadow">
                        {video.profiles?.username || 'Usuario'}
                      </span>
                      <span className="text-white/80 text-sm">·</span>
                      <span className="text-white/80 text-sm">{formatTime(video.created_at)}</span>
                    </div>
                    
                    {/* Descripción */}
                    {video.content && (
                      <p className="text-white text-shadow leading-relaxed mb-2">
                        {video.content}
                      </p>
                    )}

                    {/* Estadísticas */}
                    <div className="flex items-center space-x-3 text-sm text-white/90 mb-2">
                      <span>{video.views_count || 0} vistas</span>
                      <span>•</span>
                      <span>{video.likes_count || 0} me gusta</span>
                      <span>•</span>
                      <span>{video.comments_count || 0} comentarios</span>
                    </div>
                  </div>

                  {/* Botones derecha */}
                  <div className="flex flex-col items-center space-y-4">
                    {/* Like */}
                    <button 
                      onClick={() => handleLike(index)}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center mb-1">
                        <Heart className={`w-7 h-7 ${video.is_liked ? 'text-red-500 fill-current' : 'text-white'}`} />
                      </div>
                      <span className="text-white text-xs font-medium">{video.likes_count || 0}</span>
                    </button>

                    {/* Comentarios */}
                    <button 
                      onClick={() => navigate(`/post/${video.id}`)}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center mb-1">
                        <MessageCircle className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium">{video.comments_count || 0}</span>
                    </button>

                    {/* Compartir */}
                    <button className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center mb-1">
                        <Share className="w-7 h-7 text-white" />
                      </div>
                    </button>

                    {/* Más opciones */}
                    <button className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <MoreHorizontal className="w-7 h-7 text-white" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Indicador de carga al final */}
        {loadingMore && (
          <div 
            className="w-full snap-start bg-black flex items-center justify-center"
            style={{ 
              height: '100vh',
              height: '100dvh'
            }}
          >
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Cargando más videos...</p>
            </div>
          </div>
        )}
        
        {/* Mensaje de fin de videos */}
        {!hasMoreVideos && videos.length > 0 && !loadingMore && (
          <div 
            className="w-full snap-start bg-black flex items-center justify-center"
            style={{ 
              height: '100vh',
              height: '100dvh'
            }}
          >
            <div className="text-white text-center">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg mb-2">¡Has visto todos los videos!</p>
              <p className="text-white/70">Vuelve más tarde para ver contenido nuevo</p>
              <button 
                onClick={() => navigate(-1)}
                className="mt-4 px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoViewer