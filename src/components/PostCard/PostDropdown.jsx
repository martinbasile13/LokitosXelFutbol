import { 
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Flag,
  Loader2
} from 'lucide-react'

const PostDropdown = ({ 
  post, 
  isOwner, 
  isDeleting, 
  onEdit, 
  onDelete, 
  onFollow, 
  onReport 
}) => {
  const truncateText = (text, maxLength) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    
    document.activeElement?.blur()
    
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('📋 ¡Enlace copiado!')
    }).catch((error) => {
      console.error('Error copiando:', error)
      prompt('Copia este enlace manualmente:', postUrl)
    })
  }

  return (
    <div 
      className="dropdown dropdown-end ml-4"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <MoreHorizontal className="w-5 h-5 text-base-content/60" />
      </div>
      
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
        {/* Copiar enlace */}
        <li>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCopyLink()
            }}
            className="flex items-center gap-2 w-full text-left"
          >
            📋 Copiar enlace
          </button>
        </li>
        
        {isOwner ? (
          /* Opciones del propietario */
          <>
            <li>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit()
                }}
                className="flex items-center gap-2 w-full text-left"
              >
                <Edit className="w-4 h-4" />
                Editar post
              </button>
            </li>
            <li>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete()
                }}
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFollow()
                }}
                className="flex items-center gap-2 w-full text-left"
              >
                <UserPlus className="w-4 h-4" />
                Seguir a @{truncateText(post.profiles?.username || 'usuario', 12)}
              </button>
            </li>
            <li>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onReport()
                }}
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
  )
}

export default PostDropdown