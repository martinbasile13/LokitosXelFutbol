import { Link } from 'react-router-dom'
import Avatar from '../UI/Avatar'
import TeamBadge from '../UI/TeamBadge'
import PostDropdown from './PostDropdown'

const PostHeader = ({ 
  post, 
  user, 
  onEdit, 
  onDelete, 
  onFollow, 
  onReport, 
  isDeleting 
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const truncateText = (text, maxLength) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const isOwner = user?.id === post.user_id

  return (
    <div className="flex items-start space-x-3 p-6 pb-3">
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
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Link 
            to={`/user/${post.user_id}`}
            className="hover:underline"
          >
            <h3 className="font-bold truncate max-w-[8ch] sm:max-w-[12ch] md:max-w-[16ch]" 
                title={post.profiles?.username || 'Usuario'}>
              {truncateText(post.profiles?.username || 'Usuario', 8)}
            </h3>
          </Link>
          <span className="text-base-content/50">·</span>
          <span className="text-base-content/50 text-sm">{formatTime(post.created_at)}</span>
          {post.profiles?.team && (
            <TeamBadge team={post.profiles.team} size="sm" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            to={`/user/${post.user_id}`}
            className="hover:underline"
          >
            <span className="text-base-content/70 text-sm truncate max-w-[12ch] sm:max-w-[16ch] md:max-w-[24ch]" 
                  title={`@${post.profiles?.username || 'usuario'}`}>
              @{truncateText(post.profiles?.username || 'usuario', 8)}
            </span>
          </Link>
          {post.profiles?.team && (
            <>
              <span className="text-base-content/50">·</span>
              <span className="text-base-content/60 text-xs truncate max-w-[16ch] sm:max-w-[20ch] md:max-w-[32ch]" 
                    title={post.profiles.team}>
                {truncateText(post.profiles.team, 20)}
              </span>
            </>
          )}
        </div>
      </div>

      <PostDropdown 
        post={post}
        isOwner={isOwner}
        isDeleting={isDeleting}
        onEdit={onEdit}
        onDelete={onDelete}
        onFollow={onFollow}
        onReport={onReport}
      />
    </div>
  )
}

export default PostHeader