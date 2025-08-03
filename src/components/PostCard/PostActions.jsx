import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  MessageCircle, 
  Heart,
  HeartCrack,
  ThumbsDown,
  ThumbsUp,
  ChartNoAxesColumn
} from 'lucide-react'
import { likePost, dislikePost } from '../../services/posts'

const PostActions = ({ 
  post, 
  user, 
  isLoading: parentLoading, 
  onLike, 
  onDislike 
}) => {
  // Estados locales para actualización inmediata
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [dislikesCount, setDislikesCount] = useState(post.dislikes_count || 0)
  const [userVote, setUserVote] = useState(post.user_vote || 0)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar me gusta')
      return
    }

    if (isLoading) return
    setIsLoading(true)

    // Actualizar inmediatamente la UI
    const currentVote = userVote
    let newLikes = likesCount
    let newDislikes = dislikesCount
    let newVote = 0

    if (currentVote === 1) {
      // Ya tiene like - remover
      newLikes = Math.max(0, likesCount - 1)
      newVote = 0
    } else if (currentVote === -1) {
      // Tiene dislike - cambiar a like
      newDislikes = Math.max(0, dislikesCount - 1)
      newLikes = likesCount + 1
      newVote = 1
    } else {
      // Sin voto - agregar like
      newLikes = likesCount + 1
      newVote = 1
    }

    // Actualizar UI inmediatamente
    setLikesCount(newLikes)
    setDislikesCount(newDislikes)
    setUserVote(newVote)

    try {
      const result = await likePost(post.id, user.id)
      
      if (result.success) {
        // Confirmar con datos del servidor
        setLikesCount(result.data.likes_count)
        setDislikesCount(result.data.dislikes_count)
        setUserVote(result.data.user_vote)
      } else {
        // Revertir en caso de error
        setLikesCount(likesCount)
        setDislikesCount(dislikesCount)
        setUserVote(currentVote)
        window.showErrorAlert('Error al dar me gusta')
      }
    } catch (error) {
      // Revertir en caso de error
      setLikesCount(likesCount)
      setDislikesCount(dislikesCount)
      setUserVote(currentVote)
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

    // Actualizar inmediatamente la UI
    const currentVote = userVote
    let newLikes = likesCount
    let newDislikes = dislikesCount
    let newVote = 0

    if (currentVote === -1) {
      // Ya tiene dislike - remover
      newDislikes = Math.max(0, dislikesCount - 1)
      newVote = 0
    } else if (currentVote === 1) {
      // Tiene like - cambiar a dislike
      newLikes = Math.max(0, likesCount - 1)
      newDislikes = dislikesCount + 1
      newVote = -1
    } else {
      // Sin voto - agregar dislike
      newDislikes = dislikesCount + 1
      newVote = -1
    }

    // Actualizar UI inmediatamente
    setLikesCount(newLikes)
    setDislikesCount(newDislikes)
    setUserVote(newVote)

    try {
      const result = await dislikePost(post.id, user.id)
      
      if (result.success) {
        // Confirmar con datos del servidor
        setLikesCount(result.data.likes_count)
        setDislikesCount(result.data.dislikes_count)
        setUserVote(result.data.user_vote)
      } else {
        // Revertir en caso de error
        setLikesCount(likesCount)
        setDislikesCount(dislikesCount)
        setUserVote(currentVote)
        window.showErrorAlert('Error al dar no me gusta')
      }
    } catch (error) {
      // Revertir en caso de error
      setLikesCount(likesCount)
      setDislikesCount(dislikesCount)
      setUserVote(currentVote)
      window.showErrorAlert('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-6 pb-4">
      <div className="flex items-center justify-between w-full max-w-2xl">
        {/* Comentarios/Replies */}
        <Link 
          to={`/post/${post.id}`}
          className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">
            {post.replies_count || post.comments_count || 0}
          </span>
          <span className="text-sm text-base-content/60 hidden sm:inline">
            {post.is_reply ? 'Responder' : 'Comentar'}
          </span>
        </Link>

        {/* Me gusta */}
        <button 
          className={`flex items-center space-x-2 transition-all duration-200 group ${
            userVote === 1
              ? 'text-white-600' 
              : 'text-base-content/60'
          }`}
          onClick={handleLike}
          disabled={isLoading || parentLoading}
        >
          <div className={`p-2 rounded-full transition-all duration-200 ${
            userVote === 1
              ? '' 
              : 'group-hover:bg-blue-50'
          }`}>
            <Heart className={`w-5 h-5 transition-all duration-200 ${
              userVote === 1 ? 'fill-current scale-110' : 'group-hover:text-gray-600'
            }`} />
          </div>
          <span className={`text-sm font-medium transition-all duration-200 ${
            userVote === 1 ? 'text-base-content/60' : ''
          }`}>
            {likesCount}
          </span>
          <span className="text-sm text-base-content/60 hidden sm:inline">Me gusta</span>
        </button>

        {/* No me gusta */}
        <button 
          className={`flex items-center space-x-2 transition-all duration-200 group ${
            userVote === -1
              ? 'text-base-content/80' 
              : 'text-base-content/60'
          }`}
          onClick={handleDislike}
          disabled={isLoading || parentLoading}
        >
          <div className={`p-2 rounded-full transition-all duration-200 ${
            userVote === -1
              ? ''
              : 'group-hover:bg-red-50'
          }`}>
            <HeartCrack className={`w-5 h-5 transition-all duration-200 ${
              userVote === -1 ? 'fill-current' : 'group-hover:text-gray-400'
            }`} />
          </div>
          <span className={`text-sm font-medium transition-all duration-200`}>
            {dislikesCount}
          </span>
          <span className="text-sm text-base-content/60 hidden sm:inline">No me gusta</span>
        </button>

        {/* Vistas */}
        <div className="flex items-center space-x-2 text-base-content/60">
          <div className="p-2 rounded-full">
            <ChartNoAxesColumn className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{post.views_count || 0}</span>
          <span className="text-sm text-base-content/60 hidden sm:inline">Vistas</span>
        </div>
      </div>
    </div>
  )
}

export default PostActions