import { Link } from 'react-router-dom'
import { useScrollRestore } from '../shared/hooks/useScrollPosition'
import MentionText from '../Mentions/MentionText'

const PostContent = ({ post, onClick, isReply = false, disableNavigation = false }) => {
  const { saveScrollPosition } = useScrollRestore()

  const handleClick = (e) => {
    // Si la navegación está deshabilitada (porque el Link está en el padre), no hacer nada
    if (disableNavigation) return
    
    // Guardar la posición actual del scroll antes de navegar
    const currentPath = window.location.pathname
    saveScrollPosition(currentPath)
    console.log('💾 Guardando posición antes de navegar a post detail')
    
    // Ejecutar el onClick original si existe
    if (onClick) {
      onClick(e)
    }
  }

  // Si la navegación está deshabilitada, renderizar sin Link
  if (disableNavigation) {
    return (
      <div className={`px-6 pb-3 ${isReply ? 'px-4 pb-2' : ''}`}>
        <div className={`mt-3 ${isReply ? 'mt-1' : ''}`}>
          {/* Mostrar título solo en posts principales */}
          {post.title && !isReply && (
            <h2 className="text-lg font-semibold mb-2 text-base-content">
              {post.title}
            </h2>
          )}
          
          {/* Contenido con menciones renderizadas */}
          <MentionText 
            text={post.content}
            className={`text-base-content leading-relaxed break-words hyphens-auto whitespace-pre-wrap overflow-hidden ${
              isReply ? 'text-sm' : ''
            }`}
            disableLinks={true}
          />
        </div>
      </div>
    )
  }

  // Renderizado normal con Link (para casos especiales)
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
        
        {/* Contenido con menciones renderizadas */}
        <MentionText 
          text={post.content}
          className={`text-base-content leading-relaxed break-words hyphens-auto whitespace-pre-wrap overflow-hidden ${
            isReply ? 'text-sm' : ''
          }`}
          disableLinks={true}
        />
      </div>
    </Link>
  )
}

export default PostContent