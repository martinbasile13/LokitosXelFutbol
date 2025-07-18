import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import ViewsDebugger from '../components/ViewsDebugger'
import VotesDebugger from '../components/VotesDebugger'
import TeamBadge from '../components/TeamBadge'
import { 
  getPostById, 
  getPostComments, 
  createComment, 
  votePost, 
  voteComment,
  likePost,
  unlikePost,
  deletePost,
  addPostView
} from '../services/postService'
import { 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  Heart, 
  ChartNoAxesColumn,
  ArrowLeft,
  Reply,
  MoreHorizontal,
  Trash2,
  Edit,
  Flag,
  Loader2,
  UserPlus
} from 'lucide-react'

// Componente de comentario separado para evitar re-renderizado en cada keystroke
const CommentComponent = ({ 
  comment, 
  depth = 0, 
  onVote, 
  replyingTo, 
  onReply,
  onCancelReply,
  newComment, 
  setNewComment, 
  isCommenting, 
  handleComment, 
  userProfile, 
  truncateText, 
  formatTime, 
  user 
}) => {
  return (
    <div className={`${depth > 0 ? 'ml-8' : ''} mb-4`}>
      <div className="flex space-x-3">
        {/* Línea vertical para comentarios anidados */}
        {depth > 0 && (
          <div className="w-0.5 bg-base-300 -ml-4 mr-3"></div>
        )}
        
        {/* Avatar */}
        <Avatar 
          src={comment.profiles?.avatar_url}
          alt={`Avatar de ${comment.profiles?.username}`}
          name={comment.profiles?.username || 'Usuario'}
          size="sm"
          className="flex-shrink-0"
        />

        {/* Contenido del comentario */}
        <div className="flex-1 min-w-0">
          {/* Header del comentario */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm truncate max-w-[10ch] sm:max-w-[14ch] md:max-w-[20ch]" title={comment.profiles?.username || 'Usuario'}>
              {truncateText(comment.profiles?.username || 'Usuario', 10)}
            </span>
            <span className="text-xs text-base-content/50">{formatTime(comment.created_at)}</span>
            {comment.profiles?.team && (
              <TeamBadge team={comment.profiles.team} size="xs" />
            )}
          </div>

          {/* Contenido responsivo */}
          <p className="text-sm mb-2 break-words hyphens-auto whitespace-pre-wrap overflow-hidden">{comment.content}</p>

          {/* Acciones del comentario */}
          <div className="flex items-center space-x-4">
            {/* Votaciones */}
            <div className="flex items-center space-x-1">
              <button 
                className={`p-1 rounded hover:bg-orange-50 transition-colors ${
                  comment.user_vote === 'up' ? 'text-orange-500 bg-orange-50' : 'text-base-content/60 hover:text-orange-500'
                }`}
                onClick={() => onVote('up', true, comment.id)}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className={`text-xs font-medium min-w-[1.5rem] text-center ${
                comment.user_vote === 'up' ? 'text-orange-500' : comment.user_vote === 'down' ? 'text-blue-500' : 'text-base-content'
              }`}>
                {comment.upvotes - comment.downvotes}
              </span>
              <button 
                className={`p-1 rounded hover:bg-blue-50 transition-colors ${
                  comment.user_vote === 'down' ? 'text-blue-500 bg-blue-50' : 'text-base-content/60 hover:text-blue-500'
                }`}
                onClick={() => onVote('down', true, comment.id)}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Responder */}
            <button 
              className="flex items-center space-x-1 text-base-content/60 hover:text-blue-500 transition-colors text-xs"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="w-3 h-3" />
              <span>Responder</span>
            </button>

            {/* Más opciones */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-circle">
                <MoreHorizontal className="w-3 h-3" />
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow border border-base-300">
                {comment.user_id === user?.id ? (
                  <>
                    <li>
                      <a className="flex items-center gap-2 text-xs">
                        <Edit className="w-3 h-3" />
                        Editar
                      </a>
                    </li>
                    <li>
                      <a className="flex items-center gap-2 text-xs text-error">
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </a>
                    </li>
                  </>
                ) : (
                  <li>
                    <a className="flex items-center gap-2 text-xs text-warning">
                      <Flag className="w-3 h-3" />
                      Reportar
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Formulario de respuesta */}
          {replyingTo === comment.id && (
            <div className="mt-3 p-3 bg-base-200 rounded-lg">
              <div className="flex space-x-2">
                <Avatar 
                  src={userProfile?.avatar_url}
                  alt="Tu avatar"
                  name={userProfile?.username || 'Usuario'}
                  size="xs"
                />
                <div className="flex-1">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Respondiendo a ${truncateText(comment.profiles?.username || 'Usuario', 12)}...`}
                    className="textarea textarea-sm w-full resize-none"
                    rows="2"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button 
                      className="btn btn-ghost btn-xs"
                      onClick={onCancelReply}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="btn btn-primary btn-xs"
                      onClick={handleComment}
                      disabled={!newComment.trim() || isCommenting}
                    >
                      {isCommenting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Responder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Respuestas anidadas */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => (
                <CommentComponent 
                  key={reply.id} 
                  comment={reply} 
                  depth={depth + 1}
                  onVote={onVote}
                  replyingTo={replyingTo}
                  onReply={onReply}
                  onCancelReply={onCancelReply}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  isCommenting={isCommenting}
                  handleComment={handleComment}
                  userProfile={userProfile}
                  truncateText={truncateText}
                  formatTime={formatTime}
                  user={user}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const PostDetail = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [isCommenting, setIsCommenting] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (postId) {
      loadPostData()
    }
  }, [postId, user?.id])

  const loadPostData = async () => {
    try {
      setLoading(true)
      
      // Cargar post y comentarios en paralelo
      const [postResult, commentsResult] = await Promise.all([
        getPostById(postId, user?.id),
        getPostComments(postId, user?.id)
      ])

      if (postResult.success) {
        setPost(postResult.data)
        
        // Registrar vista del post al cargarlo
        try {
          await addPostView(postId, user?.id)
          console.log('✅ Vista registrada en PostDetail:', postId)
        } catch (error) {
          console.error('❌ Error registrando vista en PostDetail:', error)
        }
      } else {
        console.error('Error cargando post:', postResult.error)
        setPost(null)
      }

      if (commentsResult.success) {
        setComments(commentsResult.data)
      } else {
        console.error('Error cargando comentarios:', commentsResult.error)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para truncar texto con límite de caracteres
  const truncateText = (text, maxLength) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
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



  // Funciones para el dropdown del post
  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('📋 ¡Enlace copiado!')
    }).catch((error) => {
      console.error('❌ Error copiando:', error)
      prompt('Copia este enlace manualmente:', postUrl)
    })
  }

  const handleDeletePost = async () => {
    if (!user?.id || !post) {
      alert('Error: No se puede eliminar el post')
      return
    }

    const isOwner = user.id === post.user_id
    if (!isOwner) {
      alert('No puedes eliminar este post')
      return
    }

    const confirmed = confirm('¿Estás seguro de que quieres eliminar este post?')
    if (!confirmed) return

    setIsDeleting(true)
    
    try {
      const result = await deletePost(post.id, user.id)
      
      if (result.success) {
        alert('Post eliminado exitosamente')
        // Redirigir a Para Ti después de eliminar
        navigate('/para-ti')
      } else {
        console.error('Error eliminando post:', result.error)
        alert('Error al eliminar el post: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error eliminando post:', error)
      alert('Error al eliminar el post')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditPost = () => {
    if (!user?.id || !post) return
    
    const isOwner = user.id === post.user_id
    if (!isOwner) {
      alert('No puedes editar este post')
      return
    }
    
    alert('Función de editar en desarrollo. ¡Próximamente!')
  }

  const handleReportPost = () => {
    alert('Función de reportar en desarrollo. ¡Gracias por tu feedback!')
  }

  const handleFollowUser = () => {
    if (!post?.profiles?.username) return
    alert(`Función de seguir a @${post.profiles.username} en desarrollo.`)
  }

  const handleVote = async (voteType, isComment = false, targetId = null) => {
    if (!user?.id) {
      alert('Debes iniciar sesión para votar')
      return
    }

    if (isVoting) return
    setIsVoting(true)

    try {
      let result
      if (isComment) {
        result = await voteComment(targetId, user.id, voteType)
      } else {
        result = await votePost(targetId, user.id, voteType)
      }

      if (result.success) {
        if (isComment) {
          // Actualizar votos del comentario
          updateCommentVotes(targetId, result)
        } else {
          // Actualizar votos del post
          updatePostVotes(result)
        }
      } else {
        console.error('Error votando:', result.error)
        alert('Error al votar: ' + result.error.message)
      }
    } catch (error) {
      console.error('Error en handleVote:', error)
      alert('Error inesperado al votar')
    } finally {
      setIsVoting(false)
    }
  }

  const updatePostVotes = (result) => {
    setPost(prev => {
      if (!prev) return prev

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
  }

  const updateCommentVotes = (commentId, result) => {
    const updateComment = (comment) => {
      if (comment.id === commentId) {
        let newUpvotes = comment.upvotes || 0
        let newDownvotes = comment.downvotes || 0
        let newUserVote = comment.user_vote

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
          ...comment,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          user_vote: newUserVote
        }
      }

      // Buscar en respuestas
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(updateComment)
        }
      }

      return comment
    }

    setComments(prev => prev.map(updateComment))
  }

  const handleLike = async () => {
    if (!user?.id) {
      alert('Debes iniciar sesión para dar like')
      return
    }

    if (isLiking) return
    setIsLiking(true)

    try {
      if (post.user_liked) {
        // Quitar like
        const result = await unlikePost(post.id, user.id)
        
        if (result.success) {
          setPost(prev => ({
            ...prev,
            user_liked: false,
            likes_count: Math.max(0, (prev.likes_count || 0) - 1)
          }))
        } else {
          console.error('Error quitando like:', result.error)
          alert('Error quitando like')
        }
      } else {
        // Dar like
        const result = await likePost(post.id, user.id)
        
        if (result.success) {
          setPost(prev => ({
            ...prev,
            user_liked: true,
            likes_count: (prev.likes_count || 0) + 1
          }))
        } else {
          console.error('Error dando like:', result.error)
          if (result.code === 'SELF_LIKE') {
            alert('No puedes dar like a tus propios posts')
          } else if (result.code === 'ALREADY_LIKED') {
            setPost(prev => ({ ...prev, user_liked: true }))
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

  const handleComment = async () => {
    if (!user?.id) {
      alert('Debes iniciar sesión para comentar')
      return
    }

    if (!newComment.trim()) {
      alert('Escribe un comentario')
      return
    }

    setIsCommenting(true)
    try {
      const result = await createComment({
        user_id: user.id,
        post_id: postId,
        parent_comment_id: replyingTo,
        content: newComment.trim()
      })

      if (result.success) {
        if (replyingTo) {
          // Agregar como respuesta
          setComments(prev => prev.map(comment => {
            if (comment.id === replyingTo) {
              return { 
                ...comment, 
                replies: [...comment.replies, result.data] 
              }
            }
            return comment
          }))
        } else {
          // Agregar como comentario principal
          setComments(prev => [result.data, ...prev])
        }

        // Actualizar contador de comentarios del post
        setPost(prev => prev ? {
          ...prev,
          comments_count: (prev.comments_count || 0) + 1
        } : prev)

        setNewComment('')
        setReplyingTo(null)
      } else {
        console.error('Error creando comentario:', result.error)
        alert('Error al crear comentario: ' + result.error.message)
      }
    } catch (error) {
      console.error('Error en handleComment:', error)
      alert('Error inesperado al crear comentario')
    } finally {
      setIsCommenting(false)
    }
  }

  const handleReply = (commentId) => {
    setReplyingTo(commentId)
    setNewComment('')
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setNewComment('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-base-content/70">Cargando post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Post no encontrado</h2>
          <p className="text-base-content/70 mb-4">El post que buscas no existe o fue eliminado.</p>
          <Link to="/para-ti" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar izquierdo */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-6">
            {/* Header con botón volver */}
            <div className="sticky top-0 bg-base-100/95 backdrop-blur-sm border-b border-base-300 p-4 z-10 -mx-4 mb-4">
              <div className="flex items-center space-x-4">
                <Link to="/para-ti" className="btn btn-ghost btn-circle">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold">Post</h1>
              </div>
            </div>

            <div className="space-y-6">
              {/* Post principal */}
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  {/* Header del post */}
                  <div className="flex items-start space-x-3 mb-4">
                    <Avatar 
                      src={post.profiles?.avatar_url}
                      alt={`Avatar de ${post.profiles?.username}`}
                      name={post.profiles?.username || 'Usuario'}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[24ch]" title={post.profiles?.username || 'Usuario'}>
                          {truncateText(post.profiles?.username || 'Usuario', 12)}
                        </h3>
                        <span className="text-base-content/50">·</span>
                        <span className="text-base-content/50 text-sm">{formatTime(post.created_at)}</span>
                        {post.profiles?.team && (
                          <TeamBadge team={post.profiles.team} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base-content/70 text-sm truncate max-w-[16ch] sm:max-w-[20ch] md:max-w-[32ch]" title={`@${post.profiles?.username || 'usuario'}`}>
                          @{truncateText(post.profiles?.username || 'usuario', 12)}
                        </span>
                        {post.profiles?.team && (
                          <>
                            <span className="text-base-content/50">·</span>
                            <span className="text-base-content/60 text-xs truncate max-w-[20ch] sm:max-w-[24ch] md:max-w-[40ch]" title={post.profiles.team}>
                              {truncateText(post.profiles.team, 20)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido del post - Texto responsivo */}
                  <div className="mb-6">
                    <p className="text-lg leading-relaxed break-words hyphens-auto whitespace-pre-wrap overflow-hidden">{post.content}</p>
                  </div>

                  {/* Debug Views - TEMPORAL */}
                  <ViewsDebugger postId={postId} />

                  {/* Debug Votes - TEMPORAL */}
                  <VotesDebugger />

                  {/* Estadísticas */}
                  <div className="flex items-center space-x-6 py-3 border-y border-base-300">
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-5 h-5 text-base-content/60" />
                      <span className="text-sm font-medium">{post.comments_count}</span>
                      <span className="text-sm text-base-content/60">comentarios</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-5 h-5 text-base-content/60" />
                      <span className="text-sm font-medium">{post.likes_count}</span>
                      <span className="text-sm text-base-content/60">likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChartNoAxesColumn className="w-5 h-5 text-base-content/60" />
                      <span className="text-sm font-medium">{post.views_count}</span>
                      <span className="text-sm text-base-content/60">vistas</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-3">
                    {/* Votaciones */}
                    <div className="flex items-center space-x-2">
                      <button 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          post.user_vote === 'up' ? 'text-orange-500 bg-orange-50' : 'text-base-content/60 hover:text-orange-500 hover:bg-orange-50'
                        }`}
                        onClick={() => handleVote('up', false, post.id)}
                      >
                        <ChevronUp className="w-5 h-5" />
                        <span className="font-medium">{post.upvotes}</span>
                      </button>
                      <button 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          post.user_vote === 'down' ? 'text-blue-500 bg-blue-50' : 'text-base-content/60 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                        onClick={() => handleVote('down', false, post.id)}
                      >
                        <ChevronDown className="w-5 h-5" />
                        <span className="font-medium">{post.downvotes}</span>
                      </button>
                    </div>

                    {/* Otras acciones */}
                    <div className="flex items-center space-x-2">
                      <button 
                        className={`btn btn-ghost btn-sm ${
                          post.user_liked 
                            ? 'text-red-500' 
                            : 'hover:text-red-500'
                        }`}
                        onClick={handleLike}
                        disabled={isLiking}
                      >
                        <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                      </button>
                      
                      {/* Dropdown del post */}
                      <div className="dropdown dropdown-end">
                        <div 
                          tabIndex={0} 
                          role="button" 
                          className="btn btn-ghost btn-sm hover:scale-110 transition-transform duration-200"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
                          {/* Copiar enlace */}
                          <li>
                            <button 
                              type="button"
                              onClick={handleCopyLink}
                              className="flex items-center gap-2 w-full text-left"
                            >
                              📋 Copiar enlace
                            </button>
                          </li>
                          
                          {user?.id === post.user_id ? (
                            /* Opciones del propietario */
                            <>
                              <li>
                                <button 
                                  type="button"
                                  onClick={handleEditPost}
                                  className="flex items-center gap-2 w-full text-left"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar post
                                </button>
                              </li>
                              <li>
                                <button 
                                  type="button"
                                  onClick={handleDeletePost}
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
                                  onClick={handleFollowUser}
                                  className="flex items-center gap-2 w-full text-left"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Seguir a @{truncateText(post.profiles?.username || 'usuario', 12)}
                                </button>
                              </li>
                              <li>
                                <button 
                                  type="button"
                                  onClick={handleReportPost}
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
                </div>
              </div>

              {/* Formulario para nuevo comentario */}
              {!replyingTo && (
                <div className="card bg-base-100 border border-base-300">
                  <div className="card-body">
                    <h3 className="font-bold mb-4">Agregar comentario</h3>
                    <div className="flex space-x-3">
                      <Avatar 
                        src={userProfile?.avatar_url}
                        alt="Tu avatar"
                        name={userProfile?.username || 'Usuario'}
                        size="md"
                      />
                      <div className="flex-1">
                        <textarea 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="¿Qué opinas sobre este post?"
                          className="textarea textarea-bordered w-full resize-none"
                          rows="3"
                        />
                        <div className="flex justify-end space-x-2 mt-3">
                          {newComment.trim() && (
                            <button 
                              className="btn btn-ghost"
                              onClick={() => setNewComment('')}
                            >
                              Cancelar
                            </button>
                          )}
                          <button 
                            className="btn btn-primary"
                            onClick={handleComment}
                            disabled={!newComment.trim() || isCommenting}
                          >
                            {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Comentar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de comentarios */}
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold mb-4">
                    Comentarios ({comments.length})
                  </h3>
                  
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                      <p className="text-base-content/60">Aún no hay comentarios</p>
                      <p className="text-base-content/40 text-sm">¡Sé el primero en comentar!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map(comment => (
                        <CommentComponent 
                          key={comment.id} 
                          comment={comment}
                          onVote={handleVote}
                          replyingTo={replyingTo}
                          onReply={handleReply}
                          onCancelReply={handleCancelReply}
                          newComment={newComment}
                          setNewComment={setNewComment}
                          isCommenting={isCommenting}
                          handleComment={handleComment}
                          userProfile={userProfile}
                          truncateText={truncateText}
                          formatTime={formatTime}
                          user={user}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Panel derecho - Solo visible en desktop */}
          <div className="hidden xl:block xl:col-span-3">
            <div className="sticky top-20">
              <RightPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostDetail 