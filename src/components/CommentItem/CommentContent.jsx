import MentionText from '../Mentions/MentionText'

const CommentContent = ({ comment }) => {
  return (
    <div className="mb-3">
      {/* Solo mostrar el emoji si no hay texto real */}
      {comment.content && comment.content !== '📎' && (
        <div className="text-sm leading-relaxed break-words whitespace-pre-wrap mb-2">
          <MentionText 
            text={comment.content}
            className="text-base-content"
          />
        </div>
      )}
      
      {/* Imagen del comentario */}
      {comment.image_url && (
        <div className="mt-2">
          <img 
            src={comment.image_url} 
            alt="Imagen del comentario" 
            className="max-w-full max-h-48 object-contain rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              // Abrir imagen en modal (implementar si necesario)
            }}
          />
        </div>
      )}

      {/* Video del comentario */}
      {comment.video_url && (
        <div className="mt-2">
          <video 
            src={comment.video_url} 
            controls
            className="max-w-full max-h-48 object-contain rounded-lg border border-base-300"
            preload="metadata"
          >
            Tu navegador no soporta el elemento video.
          </video>
        </div>
      )}
    </div>
  )
}

export default CommentContent