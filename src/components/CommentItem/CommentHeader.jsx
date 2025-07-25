import { Link } from 'react-router-dom'
import TeamBadge from '../UI/TeamBadge'

const CommentHeader = ({ comment }) => {
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div className="flex items-center space-x-2 mb-1">
      <Link 
        to={`/user/${comment.user_id}`}
        className="hover:underline"
      >
        <h4 className="font-bold text-sm">{comment.profiles?.username || 'Usuario'}</h4>
      </Link>
      {comment.profiles?.team && (
        <TeamBadge team={comment.profiles.team} size="xs" />
      )}
      <span className="text-base-content/50 text-sm">·</span>
      <span className="text-base-content/50 text-sm">{formatTimeAgo(comment.created_at)}</span>
    </div>
  )
}

export default CommentHeader