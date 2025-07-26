import { useState } from 'react'
import PostCard from '../PostCard'
import PostComposer from '../PostComposer'
import { MessageCircle, CornerDownRight } from 'lucide-react'

const ThreadedReply = ({ 
  reply, 
  level = 0, 
  onDelete, 
  onReplyCreated,
  isLast = false,
  parentUsername = null,
  maxLevel = 3 
}) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false)
  const hasSubReplies = reply.replies && reply.replies.length > 0
  const canNest = level < maxLevel

  // Manejar nueva reply creada
  const handleNewReply = (newReply) => {
    reply.replies = reply.replies || []
    reply.replies.push(newReply)
    
    if (onReplyCreated) {
      onReplyCreated(newReply)
    }
    
    setShowReplyComposer(false)
  }

  return (
    <div className="thread-reply-container">
      {/* Contenedor principal con threading visual */}
      <div className={`relative ${level > 0 ? 'ml-12' : ''}`}>
        
        {/* Línea de conexión vertical para threading */}
        {level > 0 && (
          <div className="absolute left-[-24px] top-0 bottom-0 w-0.5 bg-gray-300"></div>
        )}
        
        {/* Línea de conexión horizontal */}
        {level > 0 && (
          <div className="absolute left-[-24px] top-8 w-6 h-0.5 bg-gray-300"></div>
        )}

        {/* Indicador "Respondiendo a" estilo Twitter */}
        {level > 0 && parentUsername && (
          <div className="flex items-center mb-2 text-gray-500 text-sm">
            <CornerDownRight className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              Respondiendo a <span className="text-blue-500 hover:underline cursor-pointer">@{parentUsername}</span>
            </span>
          </div>
        )}

        {/* El PostCard normal SIN modificaciones - mantiene toda la funcionalidad */}
        <PostCard
          post={reply}
          isReply={true}
          replyLevel={level}
          onDelete={onDelete}
        />

        {/* Composer para responder (cuando está activo) */}
        {showReplyComposer && canNest && (
          <div className="mt-3 border-l-4 border-blue-500 bg-blue-50/50 rounded-r-lg overflow-hidden">
            <div className="p-4">
              <PostComposer
                isReply={true}
                parentPost={reply}
                onPostCreated={handleNewReply}
                onClose={() => setShowReplyComposer(false)}
                placeholder={`Responder a @${reply.profiles?.username}...`}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Sub-replies recursivas con threading */}
        {hasSubReplies && canNest && (
          <div className="mt-4">
            {reply.replies.map((subReply, index) => (
              <ThreadedReply
                key={subReply.id}
                reply={subReply}
                level={level + 1}
                onDelete={onDelete}
                onReplyCreated={onReplyCreated}
                isLast={index === reply.replies.length - 1}
                parentUsername={reply.profiles?.username}
                maxLevel={maxLevel}
              />
            ))}
          </div>
        )}

        {/* Indicador de más replies si hay límite */}
        {hasSubReplies && !canNest && (
          <div className="mt-3 ml-6 text-blue-500 text-sm hover:underline cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-gray-300"></div>
              <MessageCircle className="w-4 h-4" />
              <span>Mostrar {reply.replies.length} respuesta{reply.replies.length !== 1 ? 's' : ''} más</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThreadedReply