import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPostById, getCommentsByPost, createComment, likePost, unlikePost, addPostView } from '../services/postService'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import { applyVideoPreferences } from '../services/videoPreferences'
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  ChartNoAxesColumn, 
  Share,
  Loader2,
  Camera,
  Smile,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react'

const PostDetail = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [viewRegistered, setViewRegistered] = useState(false)
  
  // Estados para control de video
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [showVideoControls, setShowVideoControls] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (postId) {
      loadPost()
      loadComments()
    }
  }, [postId])

  // Registrar vista automáticamente cuando se carga el post
  useEffect(() => {
    if (!viewRegistered && post?.id && user?.id) {
      const registerView = async () => {
        try {
          console.log('🎯 Registrando vista para post detail:', post.id)
          const result = await addPostView(post.id, user.id)
          if (result.success) {
            console.log('✅ Vista registrada en post detail')
            setViewRegistered(true)
            // Actualizar contador local de vistas
            setPost(prev => ({
              ...prev,
              views_count: (prev.views_count || 0) + 1
            }))
          }
        } catch (error) {
          console.error('💥 Error registrando vista en post detail:', error)
        }
      }
      
      // Pequeño delay para evitar spam
      const timer = setTimeout(registerView, 500)
      return () => clearTimeout(timer)
    }
  }, [post?.id, user?.id, viewRegistered])

  // Aplicar preferencias de video al cargar
  useEffect(() => {
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
  }, [post?.video_url])

  const loadPost = async () => {
    try {
      const postData = await getPostById(postId, user?.id)
      setPost(postData)
    } catch (error) {
      console.error('Error cargando post:', error)
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const commentsData = await getCommentsByPost(postId)
      setComments(commentsData)
    } catch (error) {
      console.error('Error cargando comentarios:', error)
    }
  }

  const handleLike = async () => {
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar me gusta')
      return
    }

    if (isLiking) return
    setIsLiking(true)

    try {
      let result
      
      if (post.is_liked) {
        result = await unlikePost(post.id, user.id)
        if (result.success) {
          setPost(prev => ({
            ...prev,
            likes_count: Math.max(0, (prev.likes_count || 0) - 1),
            is_liked: false
          }))
        }
      } else {
        result = await likePost(post.id, user.id)
        if (result.success) {
          setPost(prev => ({
            ...prev,
            likes_count: (prev.likes_count || 0) + 1,
            is_liked: true
          }))
        }
      }
      
      if (!result.success) {
        console.error('Error al dar me gusta:', result.error)
        window.showErrorAlert('Error al dar me gusta')
      }
    } catch (error) {
      console.error('Error en handleLike:', error)
      window.showErrorAlert('Error inesperado')
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para comentar')
      return
    }

    setIsCommenting(true)
    
    try {
      const commentData = {
        post_id: postId,
        user_id: user.id,
        content: newComment,
        parent_id: replyingTo?.id || null
      }

      const result = await createComment(commentData)
      
      if (result.success) {
        setNewComment('')
        setReplyingTo(null)
        loadComments() // Recargar comentarios
        window.showSuccessAlert('¡Comentario publicado!')
      } else {
        console.error('Error creando comentario:', result.error)
        window.showErrorAlert('Error al publicar comentario')
      }
    } catch (error) {
      console.error('Error en handleComment:', error)
      window.showErrorAlert('Error inesperado')
    } finally {
      setIsCommenting(false)
    }
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

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' a las ' + date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-base-100 flex justify-center">
          <div className="flex w-full max-w-7xl">
            <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
              <Sidebar />
            </div>
            <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-base-content/70">Cargando post...</p>
              </div>
            </div>
            <div className="hidden lg:block lg:w-96 p-4">
              <RightPanel />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!post) {
    return (
      <>
        <div className="min-h-screen bg-base-100 flex justify-center">
          <div className="flex w-full max-w-7xl">
            <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
              <Sidebar />
            </div>
            <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Post no encontrado</h2>
                <p className="text-base-content/70 mb-4">El post que buscas no existe.</p>
                <Link to="/para-ti" className="btn btn-primary">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio
                </Link>
              </div>
            </div>
            <div className="hidden lg:block lg:w-96 p-4">
              <RightPanel />
            </div>
          </div>
        </div>
      </>
    )
  }

  // Funciones de control de video
  const toggleVideoPlay = () => {
    const video = videoRef.current
    if (video) {
      if (video.paused) {
        video.play().then(() => {
          setIsVideoPlaying(true)
        }).catch(console.error)
      } else {
        video.pause()
        setIsVideoPlaying(false)
      }
    }
  }

  const toggleVideoMute = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const video = videoRef.current
    if (video) {
      const newMutedState = !video.muted
      video.muted = newMutedState
      setIsVideoMuted(newMutedState)
      console.log('🔊 Audio toggled:', newMutedState ? 'Muted' : 'Unmuted')
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
      console.log('📹 Video duration:', video.duration)
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
    
    console.log('🎯 Progress click:', { clickRatio, newTime, videoDuration })
    
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
      <div className="min-h-screen bg-base-100 flex justify-center">
        {/* Contenedor principal centrado */}
        <div className="flex w-full max-w-7xl">
          {/* Sidebar estilo Twitter - hidden en móvil */}
          <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
            <Sidebar />
          </div>

          {/* Contenido principal del post - responsive */}
          <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0">
            {/* Header con navegación - BOTÓN DE VOLVER ARREGLADO */}
            <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300">
              <div className="flex items-center space-x-4 p-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">Post</h1>
                </div>
              </div>
            </div>

            {/* Contenido del post */}
            <div className="pb-16 md:pb-20">
              {/* Post principal */}
              <div className="border-b border-base-300 p-6">
                {/* Header del usuario */}
                <div className="flex items-start space-x-3 mb-4">
                  <Link to={`/user/${post.user_id}`}>
                    <Avatar 
                      src={post.profiles?.avatar_url}
                      alt={`Avatar de ${post.profiles?.username}`}
                      name={post.profiles?.username || 'Usuario'}
                      team={post.profiles?.team}
                      size="md"
                      className="hover:scale-105 transition-transform cursor-pointer"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link 
                        to={`/user/${post.user_id}`}
                        className="hover:underline"
                      >
                        <h3 className="font-bold">{post.profiles?.username || 'Usuario'}</h3>
                      </Link>
                      {post.profiles?.team && (
                        <TeamBadge team={post.profiles.team} size="sm" />
                      )}
                    </div>
                    <Link 
                      to={`/user/${post.user_id}`}
                      className="hover:underline"
                    >
                      <span className="text-base-content/70 text-sm">@{post.profiles?.username || 'usuario'}</span>
                    </Link>
                  </div>
                </div>

                {/* Contenido del post */}
                <div className="mb-4">
                  <p className="text-xl leading-relaxed break-words hyphens-auto whitespace-pre-wrap">
                    {post.content}
                  </p>
                  
                  {/* Imagen si existe */}
                  {post.image_url && (
                    <div className="mt-4 flex justify-center">
                      <img 
                        src={post.image_url} 
                        alt="Imagen del post" 
                        className="max-w-full max-h-96 object-contain rounded-lg border border-base-300"
                        onError={(e) => {
                          console.error('Error cargando imagen:', post.image_url);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Video si existe - CON CONTROLES NATIVOS */}
                  {post.video_url && (
                    <div className="mt-4 flex justify-center">
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-base-300 bg-black">
                        <video 
                          ref={videoRef}
                          src={post.video_url} 
                          controls
                          loop
                          muted={isVideoMuted}
                          playsInline
                          preload="metadata"
                          className="w-full h-auto object-contain"
                          style={{
                            maxHeight: '500px', // Altura máxima como Twitter
                            minHeight: '200px'  // Altura mínima para videos muy anchos
                          }}
                          onError={(e) => {
                            console.error('Error cargando video:', post.video_url);
                            e.target.style.display = 'none';
                          }}
                          onLoadedMetadata={(e) => {
                            handleVideoLoadedMetadata()
                            const video = e.target
                            if (video.videoWidth && video.videoHeight) {
                              // Calcular la altura apropiada manteniendo proporción
                              const aspectRatio = video.videoWidth / video.videoHeight
                              const containerWidth = video.parentElement.clientWidth
                              
                              if (aspectRatio > 2) {
                                // Video muy horizontal: altura mínima
                                video.style.height = '200px'
                                video.style.objectFit = 'cover'
                              } else if (aspectRatio < 0.6) {
                                // Video muy vertical: altura máxima
                                video.style.height = '500px'
                                video.style.objectFit = 'contain'
                              } else {
                                // Video normal: altura automática basada en proporción
                                const calculatedHeight = Math.min(500, Math.max(200, containerWidth / aspectRatio))
                                video.style.height = `${calculatedHeight}px`
                                video.style.objectFit = 'contain'
                              }
                            }
                          }}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onPause={() => setIsVideoPlaying(false)}
                          onPlay={() => setIsVideoPlaying(true)}
                        >
                          Tu navegador no soporta el elemento video.
                        </video>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fecha y hora */}
                <div className="text-base-content/60 text-sm mb-4 border-b border-base-300 pb-4">
                  {formatFullDate(post.created_at)}
                </div>

                {/* Estadísticas */}
                <div className="flex items-center space-x-6 text-sm border-b border-base-300 pb-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold">{post.likes_count || 0}</span>
                    <span className="text-base-content/60">Me gusta</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold">{comments.length}</span>
                    <span className="text-base-content/60">Comentarios</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold">{post.views_count || 0}</span>
                    <span className="text-base-content/60">Vistas</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-around py-2 border-b border-base-300">
                  <button 
                    className="flex items-center space-x-3 hover:bg-blue-50 hover:text-blue-500 transition-colors p-3 rounded-full group"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">Comentar</span>
                  </button>

                  <button 
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center space-x-3 transition-colors p-3 rounded-full group ${
                      post.is_liked 
                        ? 'text-red-500' 
                        : 'hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">Me gusta</span>
                  </button>

                  <button className="flex items-center space-x-3 hover:bg-green-50 hover:text-green-500 transition-colors p-3 rounded-full group">
                    <Share className="w-5 h-5" />
                    <span className="font-medium">Compartir</span>
                  </button>
                </div>
              </div>

              {/* Formulario para comentar */}
              <div className="border-b border-base-300 p-6">
                <div className="flex space-x-3">
                  <Avatar 
                    src={userProfile?.avatar_url}
                    alt={userProfile?.username || 'Usuario'}
                    name={userProfile?.username || 'Usuario'}
                    team={userProfile?.team}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    {replyingTo && (
                      <div className="mb-2 p-2 bg-base-200 rounded-lg text-sm">
                        <span className="text-base-content/60">Respondiendo a </span>
                        <span className="font-bold">@{replyingTo.profiles?.username}</span>
                        <button 
                          onClick={() => setReplyingTo(null)}
                          className="ml-2 text-error hover:underline"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? "Escribe tu respuesta..." : "¿Qué opinas sobre este post?"}
                      className="textarea textarea-ghost w-full min-h-20 resize-none focus:outline-none text-lg placeholder:text-base-content/40"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <button className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors">
                          <Camera className="w-4 h-4" />
                        </button>
                        <button className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleComment}
                        disabled={!newComment.trim() || isCommenting}
                        className="btn btn-primary rounded-full px-6 disabled:opacity-50"
                      >
                        {isCommenting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Comentar'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de comentarios */}
              <div className="">
                {comments.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                    <h3 className="text-lg font-bold mb-2">¡Sé el primero en comentar!</h3>
                    <p className="text-base-content/60">
                      Comparte tu opinión sobre este post
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-base-300 p-6 hover:bg-base-50 transition-colors">
                      <div className="flex space-x-3">
                        <Link to={`/user/${comment.user_id}`}>
                          <Avatar 
                            src={comment.profiles?.avatar_url}
                            alt={`Avatar de ${comment.profiles?.username}`}
                            name={comment.profiles?.username || 'Usuario'}
                            team={comment.profiles?.team}
                            size="md"
                            className="hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Link 
                              to={`/user/${comment.user_id}`}
                              className="hover:underline"
                            >
                              <h4 className="font-bold">{comment.profiles?.username || 'Usuario'}</h4>
                            </Link>
                            <span className="text-base-content/50">·</span>
                            <span className="text-base-content/50 text-sm">{formatTime(comment.created_at)}</span>
                            {comment.profiles?.team && (
                              <TeamBadge team={comment.profiles.team} size="sm" />
                            )}
                          </div>
                          <Link 
                            to={`/user/${comment.user_id}`}
                            className="hover:underline"
                          >
                            <span className="text-base-content/70 text-sm">@{comment.profiles?.username || 'usuario'}</span>
                          </Link>
                          <p className="mt-2 text-base-content leading-relaxed break-words">
                            {comment.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-3">
                            <button 
                              onClick={() => setReplyingTo(comment)}
                              className="flex items-center space-x-1 text-base-content/60 hover:text-blue-500 transition-colors text-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Responder</span>
                            </button>
                            <button className="flex items-center space-x-1 text-base-content/60 hover:text-red-500 transition-colors text-sm">
                              <Heart className="w-4 h-4" />
                              <span>0</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho estilo Twitter - solo visible en pantallas grandes */}
          <div className="hidden lg:block lg:w-96 p-4">
            <RightPanel />
          </div>
        </div>
      </div>
    </>
  )
}

export default PostDetail