import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import { likeComment, dislikeComment, createComment } from '../services/posts'
import { uploadFileToWorker } from '../services/mediaService'
import { 
  Heart, 
  ThumbsDown, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Camera,
  Video,
  X,
  Loader2
} from 'lucide-react'

const CommentItem = ({ 
  comment, 
  postId, 
  level = 0, 
  onCommentUpdate, 
  onDeleteComment,
  maxLevel = 3 
}) => {
  const { user } = useAuth()
  const [isVoting, setIsVoting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showReplies, setShowReplies] = useState(true)
  const fileInputRef = useRef(null)

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const handleLike = async () => {
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar me gusta')
      return
    }

    if (isVoting) return
    setIsVoting(true)

    try {
      const result = await likeComment(comment.id, user.id)
      
      if (result.success && onCommentUpdate) {
        onCommentUpdate(comment.id, result.data)
      } else if (!result.success) {
        console.error('Error al dar me gusta al comentario:', result.error)
        window.showErrorAlert('Error al dar me gusta')
      }
    } catch (error) {
      console.error('Error en handleLike:', error)
      window.showErrorAlert('Error inesperado al dar me gusta')
    } finally {
      setIsVoting(false)
    }
  }

  const handleDislike = async () => {
    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para dar no me gusta')
      return
    }

    if (isVoting) return
    setIsVoting(true)

    try {
      const result = await dislikeComment(comment.id, user.id)
      
      if (result.success && onCommentUpdate) {
        onCommentUpdate(comment.id, result.data)
      } else if (!result.success) {
        console.error('Error al dar no me gusta al comentario:', result.error)
        window.showErrorAlert('Error al dar no me gusta')
      }
    } catch (error) {
      console.error('Error en handleDislike:', error)
      window.showErrorAlert('Error inesperado al dar no me gusta')
    } finally {
      setIsVoting(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validación básica de archivo
      const maxSize = file.type.startsWith('video') ? 50 * 1024 * 1024 : 5 * 1024 * 1024 // 50MB video, 5MB imagen
      
      if (file.size > maxSize) {
        window.showErrorAlert(`El archivo es muy grande. Máximo ${file.type.startsWith('video') ? '50MB' : '5MB'}`)
        return
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() && !selectedFile) {
      window.showErrorAlert('Escribe algo o selecciona un archivo')
      return
    }

    if (!user?.id) {
      window.showErrorAlert('Debes iniciar sesión para responder')
      return
    }

    setIsSubmittingReply(true)

    try {
      let mediaUrl = null
      let mediaType = null

      // Subir archivo si está seleccionado
      if (selectedFile) {
        mediaUrl = await uploadFileToWorker(selectedFile)
        mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image'
      }

      // Si no hay texto pero hay archivo, usar un placeholder
      const replyContent = replyText.trim() || (selectedFile ? '📎' : '')

      const replyData = {
        post_id: postId,
        user_id: user.id,
        content: replyContent,
        parent_comment_id: comment.id,
        image_url: mediaType === 'image' ? mediaUrl : null,
        video_url: mediaType === 'video' ? mediaUrl : null
      }

      const result = await createComment(replyData)
      
      if (result.success) {
        // Limpiar formulario
        setReplyText('')
        removeFile()
        setIsReplying(false)
        
        window.showSuccessAlert('¡Respuesta enviada!')
        
        // Notificar al componente padre para recargar comentarios
        if (onCommentUpdate) {
          onCommentUpdate('new_reply', result.data)
        }
      } else {
        console.error('Error creando respuesta:', result.error)
        window.showErrorAlert('Error al enviar respuesta')
      }
    } catch (error) {
      console.error('Error en handleReply:', error)
      window.showErrorAlert('Error inesperado')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const marginLeft = Math.min(level * 20, maxLevel * 20) // Reducir indentación

  return (
    <div className={`border-b border-base-300 transition-colors hover:bg-base-50`}>
      {/* Comentario principal */}
      <div 
        className="flex space-x-3 p-4 relative"
        style={{ paddingLeft: `${16 + marginLeft}px` }}
      >
        {/* Líneas de conexión verticales para respuestas */}
        {level > 0 && (
          <>
            {/* Línea vertical principal */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-base-300/50"
              style={{ left: `${8 + (level - 1) * 20}px` }}
            />
            {/* Línea horizontal de conexión */}
            <div 
              className="absolute top-12 w-3 h-0.5 bg-base-300/50"
              style={{ left: `${8 + (level - 1) * 20}px` }}
            />
          </>
        )}

        <Link to={`/user/${comment.user_id}`}>
          <Avatar 
            src={comment.profiles?.avatar_url}
            alt={`Avatar de ${comment.profiles?.username}`}
            name={comment.profiles?.username || 'Usuario'}
            team={comment.profiles?.team}
            size="sm"
            className="hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
          />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header del comentario */}
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
            <span className="text-base-content/50 text-sm">{formatTime(comment.created_at)}</span>
          </div>

          {/* Contenido del comentario */}
          <div className="mb-3">
            {/* Solo mostrar el emoji si no hay texto real */}
            {comment.content && comment.content !== '📎' && (
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap mb-2">
                {comment.content}
              </p>
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

          {/* Acciones del comentario */}
          <div className="flex items-center space-x-6">
            {/* Botón de responder */}
            {level < maxLevel && (
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center space-x-1 text-base-content/60 hover:text-blue-500 transition-colors text-xs group"
              >
                <div className="p-1 rounded-full group-hover:bg-blue-50 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>Responder</span>
              </button>
            )}

            {/* Botón de like */}
            <button 
              onClick={handleLike}
              disabled={isVoting}
              className={`flex items-center space-x-1 transition-colors text-xs group ${
                comment.user_vote === 1
                  ? 'text-red-500' 
                  : 'text-base-content/60 hover:text-red-500'
              }`}
            >
              <div className={`p-1 rounded-full transition-colors ${
                comment.user_vote === 1 ? '' : 'group-hover:bg-red-50'
              }`}>
                <Heart className={`w-4 h-4 ${comment.user_vote === 1 ? 'fill-current' : ''}`} />
              </div>
              <span>{comment.likes_count || 0}</span>
            </button>

            {/* Botón de dislike */}
            <button 
              onClick={handleDislike}
              disabled={isVoting}
              className={`flex items-center space-x-1 transition-colors text-xs group ${
                comment.user_vote === -1
                  ? 'text-blue-600' 
                  : 'text-base-content/60 hover:text-blue-600'
              }`}
            >
              <div className={`p-1 rounded-full transition-colors ${
                comment.user_vote === -1 ? '' : 'group-hover:bg-blue-50'
              }`}>
                <ThumbsDown className={`w-4 h-4 ${comment.user_vote === -1 ? 'fill-current' : ''}`} />
              </div>
              <span>{comment.dislikes_count || 0}</span>
            </button>

            {/* Menú de opciones */}
            {user?.id === comment.user_id && (
              <div className="dropdown dropdown-end">
                <div 
                  tabIndex={0} 
                  role="button" 
                  className="btn btn-ghost btn-circle btn-xs hover:bg-base-200 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-base-content/60" />
                </div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-36 p-1 shadow border border-base-300">
                  <li>
                    <button 
                      onClick={() => onDeleteComment?.(comment.id)}
                      className="flex items-center gap-2 w-full text-left text-error hover:bg-error hover:text-error-content text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Formulario de respuesta */}
          {isReplying && (
            <div className="mt-4 p-4 bg-base-50 border border-base-300 rounded-lg">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Responder a @${comment.profiles?.username}...`}
                className="textarea textarea-ghost w-full min-h-16 resize-none focus:outline-none text-sm bg-transparent"
                rows={2}
              />
              
              {/* Preview de archivo */}
              {previewUrl && (
                <div className="mt-3 relative">
                  {selectedFile?.type.startsWith('image') ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-32 object-contain rounded-lg border border-base-300"
                    />
                  ) : (
                    <video 
                      src={previewUrl} 
                      controls={false}
                      muted
                      className="max-w-full max-h-32 object-contain rounded-lg border border-base-300"
                    />
                  )}
                  <button 
                    onClick={removeFile}
                    className="absolute top-1 right-1 btn btn-circle btn-xs bg-black/60 hover:bg-black/80 border-none text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-1">
                  {/* Botón para imagen */}
                  <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Botón para video */}
                  <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors">
                    <Video className="w-4 h-4" />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsReplying(false)
                      setReplyText('')
                      removeFile()
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={(!replyText.trim() && !selectedFile) || isSubmittingReply}
                    className="btn btn-primary btn-sm disabled:opacity-50"
                  >
                    {isSubmittingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Responder'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Respuestas anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={showReplies ? '' : 'hidden'}>
          {level < maxLevel ? (
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                level={level + 1}
                onCommentUpdate={onCommentUpdate}
                onDeleteComment={onDeleteComment}
                maxLevel={maxLevel}
              />
            ))
          ) : (
            <div 
              className="py-3 px-4 text-sm text-primary cursor-pointer hover:underline hover:bg-base-50 transition-colors"
              style={{ paddingLeft: `${36 + (level + 1) * 20}px` }}
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