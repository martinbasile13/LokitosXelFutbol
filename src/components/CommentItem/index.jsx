import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../UI/Avatar'
import CommentHeader from './CommentHeader'
import CommentContent from './CommentContent'
import CommentActions from './CommentActions'
import CommentReplyForm from './CommentReplyForm'

const CommentItem = ({ 
  comment, 
  postId, 
  level = 0, 
  onCommentUpdate, 
  onDeleteComment,
  maxLevel = 3,
  isLastInLevel = false
}) => {
  const [isReplying, setIsReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  return (
    <div className="relative">
      {/* Líneas de conexión estilo Reddit - MEJORADAS */}
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 pointer-events-none z-0">
          {/* Generar líneas verticales para cada nivel padre */}
          {Array.from({ length: level }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 w-px bg-base-300/80 hover:bg-primary/40 transition-colors"
              style={{
                left: `${24 + i * 24}px`,
                height: i === level - 1 && isLastInLevel ? '32px' : '100%',
                zIndex: -1
              }}
            />
          ))}
          
          {/* Línea horizontal de conexión - MÁS VISIBLE */}
          <div
            className="absolute w-4 h-px bg-base-300/80"
            style={{ 
              left: `${24 + (level - 1) * 24}px`,
              top: '32px',
              zIndex: -1
            }}
          />
        </div>
      )}

      {/* Contenido del comentario */}
      <div 
        className="flex space-x-3 p-3 hover:bg-base-50/50 transition-colors relative z-10"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <Link to={`/user/${comment.user_id}`}>
          <Avatar 
            src={comment.profiles?.avatar_url}
            alt={`Avatar de ${comment.profiles?.username}`}
            name={comment.profiles?.username || 'Usuario'}
            team={comment.profiles?.team}
            size="sm"
            className="hover:scale-105 transition-transform cursor-pointer flex-shrink-0 relative z-20"
          />
        </Link>

        <div className="flex-1 min-w-0 relative z-20">
          <CommentHeader comment={comment} />
          <CommentContent comment={comment} />
          <CommentActions 
            comment={comment}
            level={level}
            maxLevel={maxLevel}
            isReplying={isReplying}
            setIsReplying={setIsReplying}
            onCommentUpdate={onCommentUpdate}
            onDeleteComment={onDeleteComment}
          />
          <CommentReplyForm 
            comment={comment}
            postId={postId}
            isReplying={isReplying}
            setIsReplying={setIsReplying}
            onCommentUpdate={onCommentUpdate}
          />
        </div>
      </div>

      {/* Respuestas anidadas */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div>
          {level < maxLevel ? (
            comment.replies.map((reply, index) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                level={level + 1}
                onCommentUpdate={onCommentUpdate}
                onDeleteComment={onDeleteComment}
                maxLevel={maxLevel}
                isLastInLevel={index === comment.replies.length - 1}
              />
            ))
          ) : (
            <div 
              className="py-2 px-3 text-sm text-primary cursor-pointer hover:underline relative z-10"
              style={{ marginLeft: `${(level + 1) * 24}px` }}
            >
              Ver {comment.replies.length} respuesta{comment.replies.length > 1 ? 's' : ''} más...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CommentItem