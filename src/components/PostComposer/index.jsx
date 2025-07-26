import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../UI/Avatar'
import { createPost, createReply } from '../../services/posts'
import TextArea from './TextArea'
import EmojiPickerComponent from './EmojiPicker'
import { Loader2, Camera, Video, X, ArrowRight } from 'lucide-react'
import { validateFile } from '../../services/mediaService'

const UPLOAD_ENDPOINT = 'https://falling-boat-f7d7.basiledev-oficial.workers.dev/upload';

const PostComposer = ({ 
  onPostCreated = () => {}, 
  onClose = () => {},
  isModal = false,
  isReply = false,
  parentPost = null,
  compact = false,
  placeholder = "¿Qué está pasando en el fútbol?"
}) => {
  const { user, userProfile } = useAuth()
  const [newPost, setNewPost] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isComposerFocused, setIsComposerFocused] = useState(isModal || isReply)
  const textareaRef = useRef(null)

  // Determinar placeholder dinámico
  const getPlaceholder = () => {
    if (isReply && parentPost) {
      const authorUsername = parentPost.profiles?.username || 'usuario'
      return placeholder || `Responder a @${authorUsername}...`
    }
    return placeholder
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    console.log('📁 [DEBUG] Archivo seleccionado:', file)
    
    if (file) {
      console.log('📋 [DEBUG] Detalles del archivo:', {
        name: file.name,
        type: file.type,
        size: file.size,
        isImage: file.type.startsWith('image'),
        isVideo: file.type.startsWith('video')
      })
      
      const validation = validateFile(file, file.type.startsWith('video') ? 'video' : 'image')
      console.log('✅ [DEBUG] Resultado de validación:', validation)
      
      if (validation.valid) {
        console.log('🖼️ [DEBUG] Archivo válido, creando preview...')
        setSelectedFile(file)
        
        const previewUrl = URL.createObjectURL(file)
        console.log('🔗 [DEBUG] Preview URL creada:', previewUrl)
        setPreviewUrl(previewUrl)
        
        console.log('📦 [DEBUG] Estados actualizados:', {
          selectedFile: file.name,
          previewUrl: previewUrl
        })
      } else {
        console.error('❌ [DEBUG] Archivo inválido:', validation.error)
        alert(validation.error)
      }
    } else {
      console.warn('⚠️ [DEBUG] No se seleccionó ningún archivo')
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const uploadFileToWorker = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Error subiendo archivo')
    }

    const data = await response.json()
    return data.url
  }

  const handleCreatePost = async () => {
    // Validar que haya contenido O archivo seleccionado
    if (!newPost.trim() && !selectedFile) {
      window.showErrorAlert('Escribe algo o selecciona una imagen/video')
      return
    }

    if (!user?.id) {
      window.showErrorAlert('Debes estar autenticado para crear un post')
      return
    }

    // Validar que si es reply, tengan parentPost
    if (isReply && !parentPost?.id) {
      window.showErrorAlert('Error: No se puede crear la respuesta')
      return
    }

    setIsPosting(true)

    try {
      let mediaUrl = null
      let mediaType = null

      // Subir archivo si está seleccionado
      if (selectedFile) {
        mediaUrl = await uploadFileToWorker(selectedFile)
        mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image'
      }

      let result
      
      if (isReply) {
        // Crear reply usando createReply
        const mediaUrls = []
        if (mediaUrl) {
          mediaUrls.push(mediaUrl)
        }
        
        console.log('🔥 Creando reply con createReply:', {
          parentPostId: parentPost.id,
          content: newPost, // Puede estar vacío si hay media
          userId: user.id,
          mediaUrls
        })
        
        result = await createReply(parentPost.id, newPost, user.id, mediaUrls)
      } else {
        // Crear post normal usando createPost
        const postData = {
          user_id: user.id,
          content: newPost,
          title: null, // Permitir NULL en título
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null,
        }

        console.log('📝 Creando post normal con createPost:', postData)
        result = await createPost(postData)
      }
      
      console.log('✅ Resultado de creación:', result)
      
      if (result.success) {
        // Agregar contadores iniciales si no están presentes
        const postWithInitialCounts = {
          ...result.data,
          views_count: result.data.views_count || 0,
          likes_count: result.data.likes_count || 0,
          dislikes_count: result.data.dislikes_count || 0,
          comments_count: result.data.comments_count || 0,
          replies_count: result.data.replies_count || 0,
          user_vote: result.data.user_vote || 0,
          is_liked: result.data.is_liked || false,
          is_disliked: result.data.is_disliked || false
        }

        // Limpiar formulario
        setNewPost('')
        setSelectedFile(null)
        setPreviewUrl(null)
        
        window.showSuccessAlert(isReply ? '¡Respuesta publicada!' : '¡Post creado exitosamente!')
        
        // Callback para actualizar el feed o cerrar modal
        onPostCreated(postWithInitialCounts)
        
        // Si es modal, cerrar
        if (isModal) {
          onClose()
        }

        // Si es reply y no es modal, reset del composer
        if (isReply && !isModal) {
          setIsComposerFocused(false)
        }
      } else {
        console.error('❌ Error creando:', result.error)
        window.showErrorAlert(`Error al ${isReply ? 'crear la respuesta' : 'crear el post'}: ${result.error || 'Error desconocido'}`)
      }
      
    } catch (error) {
      console.error('💥 Error al crear:', error)
      window.showErrorAlert(`Error al ${isReply ? 'crear la respuesta' : 'crear el post'}`)
    } finally {
      setIsPosting(false)
    }
  }

  const handleComposerFocus = () => {
    setIsComposerFocused(true)
  }

  const handleComposerBlur = () => {
    // Solo ocultar si no hay contenido ni archivo seleccionado y no es modal
    if (!newPost.trim() && !selectedFile && !isModal) {
      setIsComposerFocused(false)
    }
  }

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current
    
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = newPost
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      
      setNewPost(before + emoji + after)
      
      // Mover cursor después del emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    }
  }

  // Calcular el progreso del círculo (0-100)
  const maxChars = isReply ? 280 : 400
  const progressPercentage = Math.min((newPost.length / maxChars) * 100, 100)
  const isOverLimit = newPost.length > maxChars

  return (
    <div className={`transition-all duration-300 ${
      isModal ? 'p-6' : compact ? 'p-4 mx-4 bg-base-50 border border-base-300 rounded-xl mb-4' : `border-b border-base-300 ${
        isComposerFocused 
          ? 'p-4 md:p-6 bg-base-50' 
          : 'p-3 md:p-4'
      }`
    }`}>
      {/* Header para replies - MUY COMPACTO */}
      {isReply && parentPost && (
        <div className="mb-2 px-2 py-1 bg-base-100 rounded-md border-l-2 border-base-300">
          <p className="text-xs text-base-content/70">
            Respondiendo a <span className="font-medium">@{
              parentPost.profiles?.username || 
              parentPost.username || 
              parentPost.user?.username ||
              parentPost.author?.username ||
              'usuario'
            }</span>
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <Avatar 
          src={userProfile?.avatar_url}
          alt={userProfile?.username || 'Usuario'}
          name={userProfile?.username || 'Usuario'}
          team={userProfile?.team}
          size={compact || isReply ? "sm" : "md"}
          className="flex-shrink-0 mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <TextArea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onFocus={handleComposerFocus}
            onBlur={handleComposerBlur}
            placeholder={getPlaceholder()}
            isComposerFocused={isComposerFocused}
            isModal={isModal}
            compact={compact || isReply}
            ref={textareaRef}
          />
          
          {/* Preview de archivo - MEJORADO para replies */}
          {previewUrl && (
            <div className="mt-3 relative flex justify-center">
              {selectedFile?.type.startsWith('image') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className={`max-w-full object-contain rounded-xl border border-base-300 transition-all duration-300 shadow-sm ${
                    isReply 
                      ? 'max-h-32' 
                      : isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                  }`}
                />
              ) : (
                <div className={`bg-black rounded-xl transition-all duration-300 shadow-sm ${
                  isReply 
                    ? 'max-h-32' 
                    : isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                }`}>
                  <video 
                    src={previewUrl} 
                    controls={false}
                    muted
                    playsInline
                    className={`max-w-full object-contain rounded-xl transition-all duration-300 ${
                      isReply 
                        ? 'max-h-32' 
                        : isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                    }`}
                  />
                </div>
              )}
              <button 
                onClick={removeFile}
                className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/60 hover:bg-black/80 border-none text-white backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Opciones y botón de post - SIEMPRE MOSTRAR CONTROLES */}
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isComposerFocused ? 'mt-4' : 'mt-3'
          }`}>
            <div className="flex items-center space-x-1 relative">
              {/* Botones de media - SIEMPRE VISIBLES */}
              <>
                {/* Botón para imagen */}
                <label className={`btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group ${
                  isReply ? 'btn-xs' : ''
                }`}>
                  <Camera className={`group-hover:scale-110 transition-transform ${
                    isReply ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'
                  }`} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                
                {/* Botón para video */}
                <label className={`btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group ${
                  isReply ? 'btn-xs' : ''
                }`}>
                  <Video className={`group-hover:scale-110 transition-transform ${
                    isReply ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'
                  }`} />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {/* Botón de emojis */}
                <EmojiPickerComponent
                  onEmojiSelect={handleEmojiSelect}
                  textareaRef={textareaRef}
                  size={isReply ? 'sm' : 'md'}
                />
              </>

              {/* Mostrar caracteres restantes cuando está focused */}
              {isComposerFocused && newPost.length > (maxChars * 0.7) && (
                <div className="hidden md:flex items-center ml-3 text-xs text-base-content/60">
                  <span className={`${isOverLimit ? 'text-error' : 'text-warning'}`}>
                    {maxChars - newPost.length}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Círculo de progreso - más pequeño en replies */}
              <div className={`relative ${isReply ? 'w-5 h-5' : 'w-6 h-6 md:w-8 md:h-8'}`}>
                <svg className={`transform -rotate-90 ${isReply ? 'w-5 h-5' : 'w-6 h-6 md:w-8 md:h-8'}`} viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-base-300"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${2 * Math.PI * 14 * (1 - progressPercentage / 100)}`}
                    className={`transition-all duration-300 ${
                      isOverLimit ? 'text-error' : progressPercentage > 80 ? 'text-warning' : 'text-primary'
                    }`}
                  />
                </svg>
                {progressPercentage > 80 && !isReply && (
                  <div className={`absolute inset-0 hidden md:flex items-center justify-center text-xs font-bold ${
                    isOverLimit ? 'text-error' : 'text-warning'
                  }`}>
                    {maxChars - newPost.length}
                  </div>
                )}
              </div>
              
              {/* Botón de envío - adaptado a replies */}
              <button
                onClick={handleCreatePost}
                disabled={(!newPost.trim() && !selectedFile) || isPosting || isOverLimit}
                className={`btn btn-primary rounded-full hover:scale-105 transition-all duration-300 disabled:opacity-50 ${
                  isReply 
                    ? 'btn-sm px-4 text-sm' 
                    : compact 
                      ? 'btn-sm px-3' 
                      : isComposerFocused 
                        ? 'btn-sm md:btn-md px-4 md:px-6' 
                        : 'btn-sm px-3 md:px-4'
                }`}
              >
                {isPosting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>
                    {isReply ? 'Responder' : 'Opinar'}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Footer adicional solo para posts normales */}
          {isComposerFocused && !isModal && !isReply && (
            <div className="hidden md:flex mt-4 pt-4 border-t border-base-300 justify-between items-center">
              <div className="text-sm text-base-content/60">
                <span>Todos pueden responder</span>
              </div>
              <button
                onClick={() => {
                  if (!newPost.trim() && !selectedFile) {
                    setIsComposerFocused(false)
                    textareaRef.current?.blur()
                  }
                }}
                className="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content"
              >
                Minimizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostComposer