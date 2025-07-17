import { useState } from 'react'
import Avatar from './Avatar'

const PostCard = ({ post, currentUser, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isRetweeted, setIsRetweeted] = useState(false)
  const [likes, setLikes] = useState(0) // TODO: Implementar likes en DB
  const [retweets, setRetweets] = useState(0) // TODO: Implementar retweets en DB
  const [showComments, setShowComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleRetweet = () => {
    setIsRetweeted(!isRetweeted)
    setRetweets(prev => isRetweeted ? prev - 1 : prev + 1)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este post?')
    
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDelete(post.id)
    } catch (error) {
      console.error('Error eliminando post:', error)
      alert('Error al eliminar el post')
    } finally {
      setIsDeleting(false)
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

  // Obtener datos del usuario desde la estructura simplificada de Supabase
  const getUserData = () => {
    if (post.profiles) {
      return {
        full_name: post.profiles.username || 'Usuario',
        username: post.profiles.username || 'usuario',
        avatar_url: post.profiles.avatar_url,
        experience_points: post.profiles.experience_points || 0,
        team: post.profiles.team || 'Sin Equipo'
      }
    }
    return {
      full_name: 'Usuario',
      username: 'usuario',
      avatar_url: null,
      experience_points: 0,
      team: 'Sin Equipo'
    }
  }

  const userData = getUserData()

  const getTeamBadge = (experience) => {
    if (experience > 1000) return '🏆'
    if (experience > 500) return '⚽'
    return '🔰'
  }

  // Verificar si el usuario actual es el autor del post
  const isOwner = currentUser?.id === post.user_id

  return (
    <div className="post-card border-b border-base-300 p-4 transition-colors">
      <div className="flex space-x-3">
        {/* Avatar */}
        <Avatar 
          src={userData.avatar_url}
          alt={`Avatar de ${userData.username}`}
          name={userData.username}
          size="md"
        />

        {/* Contenido del post */}
        <div className="flex-1 min-w-0">
          {/* Header del post */}
          <div className="flex items-center space-x-2">
            <h4 className="font-bold hover:underline cursor-pointer">
              {userData.full_name}
            </h4>
            <span className="text-base-content/70">
              @{userData.username}
            </span>
            <span className="text-base-content/50">·</span>
            <span className="text-base-content/50 text-sm">
              {formatTime(post.created_at)}
            </span>
            <span className="text-sm">
              {getTeamBadge(userData.experience_points)}
            </span>
          </div>

          {/* Contenido del tweet */}
          <div className="mt-1">
            <p className="text-base-content whitespace-pre-wrap">
              {post.content}
            </p>
            
            {/* Imagen si existe */}
            {post.image_url && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-base-300">
                <img 
                  src={post.image_url} 
                  alt="Post image" 
                  className="w-full max-h-96 object-cover"
                />
              </div>
            )}

            {/* Video si existe */}
            {post.video_url && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-base-300">
                <video 
                  controls 
                  className="w-full max-h-96"
                  src={post.video_url}
                >
                  Tu navegador no soporta videos.
                </video>
              </div>
            )}
          </div>

          {/* Acciones del post */}
          <div className="flex items-center justify-between mt-3 max-w-md">
            {/* Comentarios */}
            <button 
              className="flex items-center space-x-2 text-base-content/60 hover:text-blue-500 transition-colors"
              onClick={() => setShowComments(!showComments)}
            >
              <span className="text-lg">💬</span>
              <span className="text-sm">0</span>
            </button>

            {/* Retweet */}
            <button 
              className={`flex items-center space-x-2 transition-colors ${
                isRetweeted ? 'text-green-500' : 'text-base-content/60 hover:text-green-500'
              }`}
              onClick={handleRetweet}
            >
              <span className="text-lg">🔄</span>
              <span className="text-sm">{retweets}</span>
            </button>

            {/* Like */}
            <button 
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-base-content/60 hover:text-red-500'
              }`}
              onClick={handleLike}
            >
              <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
              <span className="text-sm">{likes}</span>
            </button>

            {/* Compartir */}
            <button className="flex items-center space-x-2 text-base-content/60 hover:text-blue-500 transition-colors">
              <span className="text-lg">📤</span>
            </button>

            {/* Más opciones */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                <span className="text-lg">⋯</span>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                {isOwner ? (
                  <>
                    <li>
                      <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-error hover:bg-error hover:text-error-content"
                      >
                        {isDeleting ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Eliminando...
                          </>
                        ) : (
                          <>
                            🗑️ Eliminar post
                          </>
                        )}
                      </button>
                    </li>
                    <li><a>✏️ Editar post</a></li>
                  </>
                ) : (
                  <>
                    <li><a>📌 Guardar post</a></li>
                    <li><a>🚩 Reportar</a></li>
                    <li><a>➕ Seguir a @{userData.username}</a></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Sección de comentarios */}
          {showComments && (
            <div className="mt-4 p-3 bg-base-200 rounded-lg">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Escribe tu comentario..." 
                  className="input input-sm flex-1 bg-base-100"
                />
                <button className="btn btn-primary btn-sm">
                  Comentar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostCard 