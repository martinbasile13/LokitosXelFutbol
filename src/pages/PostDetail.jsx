import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPostById, getCommentsByPost, createComment, likePost, unlikePost, addPostView } from '../services/postService'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  ChartNoAxesColumn, 
  Share,
  Loader2,
  Camera,
  Smile
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
                  
                  {/* Video si existe */}
                  {post.video_url && (
                    <div className="mt-4 flex justify-center bg-black rounded-lg">
                      <video 
                        src={post.video_url} 
                        controls 
                        className="max-w-full max-h-96 object-contain rounded-lg"
                        onError={(e) => {
                          console.error('Error cargando video:', post.video_url);
                          e.target.style.display = 'none';
                        }}
                      >
                        Tu navegador no soporta el elemento video.
                      </video>
                    </div>
                  )}
                </div>

                {/* Fecha */}
                <div className="text-base-content/60 text-sm mb-4 pb-4 border-b border-base-300">
                  {formatFullDate(post.created_at)}
                </div>

                {/* Estadísticas */}
                <div className="flex items-center space-x-6 py-3 border-b border-base-300">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{post.likes_count || 0}</span>
                    <span className="text-base-content/70 text-sm">Me gusta</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{comments.length}</span>
                    <span className="text-base-content/70 text-sm">Comentarios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{post.views_count || 0}</span>
                    <span className="text-base-content/70 text-sm">Vistas</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-around py-3">
                  <button 
                    className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                    onClick={() => document.getElementById('comment-input')?.focus()}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">Comentar</span>
                  </button>

                  <button 
                    className={`flex items-center space-x-2 transition-colors ${
                      post.is_liked 
                        ? 'text-red-500' 
                        : 'text-base-content/60 hover:text-red-500'
                    }`}
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">Me gusta</span>
                  </button>

                  <button className="flex items-center space-x-2 text-base-content/60 hover:text-green-500 transition-colors">
                    <Share className="w-5 h-5" />
                    <span className="text-sm">Compartir</span>
                  </button>
                </div>
              </div>

              {/* Formulario para nuevo comentario */}
              {!replyingTo && (
                <div className="border-b border-base-300 p-4">
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
                      <textarea
                        id="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe tu comentario..."
                        className="textarea textarea-ghost w-full resize-none focus:outline-none min-h-20 text-lg"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex space-x-2">
                          <button className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary">
                            <Camera className="w-4 h-4" />
                          </button>
                          <button className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary">
                            <Smile className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={handleComment}
                          disabled={!newComment.trim() || isCommenting}
                          className="btn btn-primary btn-sm rounded-full px-6"
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
              )}

              {/* Lista de comentarios */}
              <div>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-base-300 p-4 hover:bg-base-50 transition-colors">
                      <div className="flex space-x-3">
                        <Link to={`/user/${comment.user_id}`}>
                          <Avatar 
                            src={comment.profiles?.avatar_url}
                            alt={`Avatar de ${comment.profiles?.username}`}
                            name={comment.profiles?.username || 'Usuario'}
                            team={comment.profiles?.team}
                            size="sm"
                            className="hover:scale-105 transition-transform cursor-pointer"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Link 
                              to={`/user/${comment.user_id}`}
                              className="hover:underline"
                            >
                              <span className="font-bold text-sm">{comment.profiles?.username || 'Usuario'}</span>
                            </Link>
                            <span className="text-base-content/50 text-sm">@{comment.profiles?.username || 'usuario'}</span>
                            <span className="text-base-content/50">·</span>
                            <span className="text-base-content/50 text-sm">{formatTime(comment.created_at)}</span>
                            {comment.profiles?.team && (
                              <TeamBadge team={comment.profiles.team} size="xs" />
                            )}
                          </div>
                          <p className="text-base-content leading-relaxed break-words whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                    <h3 className="text-lg font-bold mb-2">No hay comentarios aún</h3>
                    <p className="text-base-content/60">Sé el primero en comentar este post.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho estilo Twitter - solo visible en pantallas grandes */}
          <div className="hidden lg:block lg:w-96 p-4">
            <RightPanel />
          </div>

          {/* Navegación móvil fija abajo */}
          <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 md:hidden z-50">
            <div className="flex justify-around py-2">
              <Link to="/para-ti" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Inicio</span>
              </Link>
              <Link to="/explorar" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span className="text-xs mt-1">Buscar</span>
              </Link>
              <Link to="/notificaciones" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 17H1l5 5v-5z"/>
                </svg>
                <span className="text-xs mt-1">Notif</span>
              </Link>
              <Link to="/perfil" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Perfil</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PostDetail