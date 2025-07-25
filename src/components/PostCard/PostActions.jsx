import { Link } from 'react-router-dom'
import { 
  MessageCircle, 
  Heart,
  ThumbsDown,
  ChartNoAxesColumn
} from 'lucide-react'

const PostActions = ({ 
  post, 
  user, 
  isLoading, 
  onLike, 
  onDislike 
}) => {
  return (
    <div className="flex items-center justify-between px-6 pb-4">
      <div className="flex items-center justify-between w-full max-w-2xl">
        {/* Comentarios */}
        <Link 
          to={`/post/${post.id}`}
          className="flex items-center space-x-2 hover:text-blue-500 transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{post.comments_count || 0}</span>
          <span className="text-sm text-base-content/60 hidden sm:inline">Comentarios</span>
        </Link>

        {/* Me gusta */}
        <button 
          className={`flex items-center space-x-2 transition-colors group ${
            post.user_vote === 1
              ? 'text-red-500' 
              : 'text-base-content/60 hover:text-red-500'
          }`}
          onClick={onLike}
          disabled={isLoading}
        >
          <div className={`p-2 rounded-full transition-colors ${
            post.user_vote === 1
              ? 'bg-red-100' 
              : 'group-hover:bg-red-50'
          }`}>
            <Heart className={`w-5 h-5 ${post.user_vote === 1 ? 'fill-current' : ''}`} />
          </div>
          <span className="text-sm font-medium">{post.likes_count || 0}</span>
          <span className="text-sm text-base-content/60 hidden sm:inline">Me gusta</span>
        </button>

        {/* No me gusta */}
        <button 
          className={`flex items-center space-x-2 transition-colors group ${
            post.user_vote === -1
              ? 'text-blue-600' 
              : 'text-base-content/60 hover:text-blue-600'
          }`}
          onClick={onDislike}
          disabled={isLoading}
        >
          <div className={`p-2 rounded-full transition-colors ${
            post.user_vote === -1
              ? 'bg-blue-100' 
              : 'group-hover:bg-blue-50'
          }`}>
            <ThumbsDown className={`w-5 h-5 ${post.user_vote === -1 ? 'fill-current' : ''}`} />
          </div>
          <span className="text-sm font-medium">{post.dislikes_count || 0}</span>
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