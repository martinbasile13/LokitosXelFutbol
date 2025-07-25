import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { createComment } from '../../services/posts'
import { uploadFileToWorker } from '../../services/mediaService'
import { 
  Camera,
  Video,
  X,
  Loader2
} from 'lucide-react'

const CommentReplyForm = ({ 
  comment, 
  postId, 
  isReplying, 
  setIsReplying, 
  onCommentUpdate 
}) => {
  const { user } = useAuth()
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

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

  const handleCancel = () => {
    setIsReplying(false)
    setReplyText('')
    removeFile()
  }

  if (!isReplying) return null

  return (
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
            onClick={handleCancel}
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
  )
}

export default CommentReplyForm