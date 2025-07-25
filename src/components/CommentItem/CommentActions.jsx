import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { likeComment, dislikeComment } from '../../services/posts'
import { 
  Heart, 
  ThumbsDown, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2
} from 'lucide-react'

const CommentActions = ({ 
  comment, 
  level, 
  maxLevel, 
  isReplying, 
  setIsReplying, 
  onCommentUpdate, 
  onDeleteComment 
}) => {
  const { user } = useAuth()
  const [isVoting, setIsVoting] = useState(false)

  const handleLike = async () => {
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar me gusta')
      return
    }

    if (isVoting) return
    setIsVoting(true)

    try {
      const result = await likeComment(comment.id, user.id)
      
      if (result.success && onCommentUpdate) {
        onCommentUpdate(comment.id, result.data)
      } else if (!result.success) {
        console.error('Error al dar me gusta al comentario:', result.error)
        window.showErrorAlert('Error al dar me gusta')
      }
    } catch (error) {
      console.error('Error en handleLike:', error)
      window.showErrorAlert('Error inesperado al dar me gusta')
    } finally {
      setIsVoting(false)
    }
  }

  const handleDislike = async () => {
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar no me gusta')
      return
    }

    if (isVoting) return
    setIsVoting(true)

    try {
      const result = await dislikeComment(comment.id, user.id)
      
      if (result.success && onCommentUpdate) {
        onCommentUpdate(comment.id, result.data)
      } else if (!result.success) {
        console.error('Error al dar no me gusta al comentario:', result.error)
        window.showErrorAlert('Error al dar no me gusta')
      }
    } catch (error) {
      console.error('Error en handleDislike:', error)
      window.showErrorAlert('Error inesperado al dar no me gusta')
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center space-x-6">
      {/* Botón de responder */}
      {level < maxLevel && (
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center space-x-1 text-base-content/60 hover:text-blue-500 transition-colors text-xs group"
        >
          <div className="p-1 rounded-full group-hover:bg-blue-50 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </div>
          <span>Responder</span>
        </button>
      )}

      {/* Botón de like */}
      <button 
        onClick={handleLike}
        disabled={isVoting}
        className={`flex items-center space-x-1 transition-colors text-xs group ${
          comment.user_vote === 1
            ? 'text-red-500' 
            : 'text-base-content/60 hover:text-red-500'
        }`}
      >
        <div className={`p-1 rounded-full transition-colors ${
          comment.user_vote === 1 ? '' : 'group-hover:bg-red-50'
        }`}>
          <Heart className={`w-4 h-4 ${comment.user_vote === 1 ? 'fill-current' : ''}`} />
        </div>
        <span>{comment.likes_count || 0}</span>
      </button>

      {/* Botón de dislike */}
      <button 
        onClick={handleDislike}
        disabled={isVoting}
        className={`flex items-center space-x-1 transition-colors text-xs group ${
          comment.user_vote === -1
            ? 'text-blue-600' 
            : 'text-base-content/60 hover:text-blue-600'
        }`}
      >
        <div className={`p-1 rounded-full transition-colors ${
          comment.user_vote === -1 ? '' : 'group-hover:bg-blue-50'
        }`}>
          <ThumbsDown className={`w-4 h-4 ${comment.user_vote === -1 ? 'fill-current' : ''}`} />
        </div>
        <span>{comment.dislikes_count || 0}</span>
      </button>

      {/* Menú de opciones */}
      {user?.id === comment.user_id && (
        <div className="dropdown dropdown-end">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost btn-circle btn-xs hover:bg-base-200 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-base-content/60" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-36 p-1 shadow border border-base-300">
            <li>
              <button 
                onClick={() => onDeleteComment?.(comment.id)}
                className="flex items-center gap-2 w-full text-left text-error hover:bg-error hover:text-error-content text-xs"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default CommentActions