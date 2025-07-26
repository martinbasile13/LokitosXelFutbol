import { Link } from 'react-router-dom'
import { useScrollRestore } from '../shared/hooks/useScrollPosition'

const PostContent = ({ post, onClick, isReply = false }) => {
  const { saveScrollPosition } = useScrollRestore()

  const handleClick = (e) => {
    // Guardar la posición actual del scroll antes de navegar
    const currentPath = window.location.pathname
    saveScrollPosition(currentPath)
    
    // Ejecutar el onClick original si existe
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <Link 
      to={`/post/${post.id}`}
      onClick={handleClick}
      className={`block cursor-pointer px-6 pb-3 ${isReply ? 'px-4 pb-2' : ''}`}
    >
      <div className={`mt-3 ${isReply ? 'mt-1' : ''}`}>
        {/* Mostrar título solo en posts principales */}
        {post.title && !isReply && (
          <h2 className="text-lg font-semibold mb-2 text-base-content">
            {post.title}
          </h2>
        )}
        
        <p className={`text-base-content leading-relaxed break-words hyphens-auto whitespace-pre-wrap overflow-hidden ${
          isReply ? 'text-sm' : ''
        }`}>
          {post.content}
        </p>
      </div>
    </Link>
  )
}

export default PostContent