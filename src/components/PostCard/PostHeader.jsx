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
  isDeleting,
  isReply = false,
  disableNavigation = false,
  hideDropdown = false
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

  const handleUserClick = (e) => {
    if (disableNavigation) {
      e.preventDefault()
      e.stopPropagation()
      // Navegar manualmente sin crear enlace HTML
      window.location.href = `/user/${post.profiles?.handle || post.profiles?.username?.toLowerCase() || 'usuario'}`
    }
  }

  const isOwner = user?.id === post.user_id
  const userProfileUrl = `/user/${post.profiles?.handle || post.profiles?.username?.toLowerCase() || 'usuario'}`

  return (
    <div className={`flex items-start space-x-3 p-6 pb-3 ${isReply ? 'py-4' : ''}`}>
      {/* Avatar */}
      {disableNavigation ? (
        <div onClick={handleUserClick} className="cursor-pointer">
          <Avatar 
            src={post.profiles?.avatar_url}
            alt={`Avatar de ${post.profiles?.username}`}
            name={post.profiles?.username || 'Usuario'}
            team={post.profiles?.team}
            size={isReply ? "sm" : "md"}
            className="hover:scale-105 transition-transform cursor-pointer"
          />
        </div>
      ) : (
        <Link to={userProfileUrl}>
          <Avatar 
            src={post.profiles?.avatar_url}
            alt={`Avatar de ${post.profiles?.username}`}
            name={post.profiles?.username || 'Usuario'}
            team={post.profiles?.team}
            size={isReply ? "sm" : "md"}
            className="hover:scale-105 transition-transform cursor-pointer"
          />
        </Link>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {/* Username */}
          {disableNavigation ? (
            <span 
              onClick={handleUserClick}
              className="hover:underline cursor-pointer"
            >
              <h3 className={`font-bold truncate max-w-[8ch] sm:max-w-[12ch] md:max-w-[16ch] ${isReply ? 'text-sm' : ''}`} 
                  title={post.profiles?.username || 'Usuario'}>
                {truncateText(post.profiles?.username || 'Usuario', 12)}
              </h3>
            </span>
          ) : (
            <Link 
              to={userProfileUrl}
              className="hover:underline"
            >
              <h3 className={`font-bold truncate max-w-[8ch] sm:max-w-[12ch] md:max-w-[16ch] ${isReply ? 'text-sm' : ''}`} 
                  title={post.profiles?.username || 'Usuario'}>
                {truncateText(post.profiles?.username || 'Usuario', 12)}
              </h3>
            </Link>
          )}
          
          {/* Handle (arroba) */}
          {disableNavigation ? (
            <span 
              onClick={handleUserClick}
              className="hover:underline cursor-pointer"
            >
              <span className={`text-base-content/60 text-sm truncate max-w-[10ch] sm:max-w-[14ch] md:max-w-[18ch] ${isReply ? 'text-xs' : ''}`} 
                    title={`@${post.profiles?.handle || post.profiles?.username?.toLowerCase() || 'usuario'}`}>
                @{truncateText(post.profiles?.handle || post.profiles?.username?.toLowerCase() || 'usuario', 10)}
              </span>
            </span>
          ) : (
            <Link 
              to={userProfileUrl}
              className="hover:underline"
            >
              <span className={`text-base-content/60 text-sm truncate max-w-[10ch] sm:max-w-[14ch] md:max-w-[18ch] ${isReply ? 'text-xs' : ''}`} 
                    title={`@${post.profiles?.handle || post.profiles?.username?.toLowerCase() || 'usuario'}`}>
                @{truncateText(post.profiles?.handle || post.profiles?.username?.toLowerCase() || 'usuario', 10)}
              </span>
            </Link>
          )}
          
          <span className="text-base-content/50">·</span>
          <span className={`text-base-content/50 text-sm ${isReply ? 'text-xs' : ''}`}>{formatTime(post.created_at)}</span>
          
          {/* Mostrar "Respondiendo a" solo en replies */}
          {isReply && post.parent_post_id && (
            <>
              <span className="text-base-content/50">·</span>
              <span className="text-blue-500 text-xs">
                Respondiendo a @{post.parent_username || post.parent_user?.username || post.parent_post?.profiles?.username || 'usuario'}
              </span>
            </>
          )}
          
          {post.profiles?.team && !isReply && (
            <>
              <span className="text-base-content/50">·</span>
              <TeamBadge team={post.profiles.team} size="sm" />
            </>
          )}
        </div>
        
        {/* Segunda línea solo para el equipo si hay espacio */}
        {post.profiles?.team && !isReply && (
          <div className="flex items-center space-x-2 mt-1 sm:hidden">
            <span className="text-base-content/60 text-xs truncate max-w-[20ch]" 
                  title={post.profiles.team}>
              ⚽ {truncateText(post.profiles.team, 20)}
            </span>
          </div>
        )}
      </div>

      {!hideDropdown && (
        <PostDropdown 
          post={post}
          isOwner={isOwner}
          isDeleting={isDeleting}
          onEdit={onEdit}
          onDelete={onDelete}
          onFollow={onFollow}
          onReport={onReport}
        />
      )}
    </div>
  )
}

export default PostHeader