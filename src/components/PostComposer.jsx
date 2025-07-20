import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar'
import { validateFile } from '../services/mediaService'
import { createPost } from '../services/postService'
import EmojiPicker from 'emoji-picker-react'
import { 
  Camera, 
  Video, 
  X, 
  Loader2,
  Smile
} from 'lucide-react'

const UPLOAD_ENDPOINT = 'https://falling-boat-f7d7.basiledev-oficial.workers.dev/upload';

const PostComposer = ({ 
  onPostCreated = () => {}, 
  onClose = () => {},
  isModal = false,
  placeholder = "¿Qué está pasando en el fútbol?"
}) => {
  const { user, userProfile } = useAuth()
  const [newPost, setNewPost] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isComposerFocused, setIsComposerFocused] = useState(isModal)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef(null)
  const emojiPickerRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validation = validateFile(file, file.type.startsWith('video') ? 'video' : 'image')
      if (validation.valid) {
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        alert(validation.error)
      }
    }
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
    if (!newPost.trim() && !selectedFile) {
      alert('Escribe algo o selecciona una imagen/video')
      return
    }

    if (!user?.id) {
      alert('Debes estar autenticado para crear un post')
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

      const postData = {
        user_id: user.id,
        content: newPost,
        title: '',
        image_url: mediaType === 'image' ? mediaUrl : null,
        video_url: mediaType === 'video' ? mediaUrl : null,
      }

      console.log('Creando post con datos:', postData)
      const result = await createPost(postData)
      console.log('Resultado del post:', result)
      
      if (result.success) {
        // Limpiar formulario
        setNewPost('')
        setSelectedFile(null)
        setPreviewUrl(null)
        
        alert('¡Post creado exitosamente!')
        
        // Callback para actualizar el feed o cerrar modal
        onPostCreated(result.data)
        
        // Si es modal, cerrar
        if (isModal) {
          onClose()
        }
      } else {
        console.error('Error creando post:', result.error)
        alert('Error al crear el post: ' + (result.error?.message || 'Error desconocido'))
      }
      
    } catch (error) {
      console.error('Error al crear post:', error)
      alert('Error al crear el post')
    } finally {
      setIsPosting(false)
    }
  }

  // Calcular el progreso del círculo (0-100)
  const progressPercentage = Math.min((newPost.length / 400) * 100, 100)
  const isOverLimit = newPost.length > 400

  const handleComposerFocus = () => {
    setIsComposerFocused(true)
  }

  const handleComposerBlur = () => {
    // Solo ocultar si no hay contenido ni archivo seleccionado y no es modal
    if (!newPost.trim() && !selectedFile && !isModal) {
      setIsComposerFocused(false)
    }
  }

  const onEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji
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
    
    setShowEmojiPicker(false)
  }

  // Cerrar emoji picker cuando se hace click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newPost])

  // Auto-focus si es modal
  useEffect(() => {
    if (isModal && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isModal])

  return (
    <div className={`transition-all duration-300 ${
      isModal ? 'p-6' : `border-b border-base-300 ${
        isComposerFocused 
          ? 'p-4 md:p-6 bg-base-50' 
          : 'p-3 md:p-4'
      }`
    }`}>
      <div className="flex space-x-2 md:space-x-3">
        <Avatar 
          src={userProfile?.avatar_url}
          alt={userProfile?.username || 'Usuario'}
          name={userProfile?.username || 'Usuario'}
          team={userProfile?.team} // Agregar equipo del usuario
          size="md"
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onFocus={handleComposerFocus}
            onBlur={handleComposerBlur}
            placeholder={placeholder}
            className={`textarea textarea-ghost w-full resize-none focus:outline-none overflow-hidden transition-all duration-200 ${
              isComposerFocused 
                ? 'min-h-24 md:min-h-32 text-lg md:text-xl placeholder:text-base-content/40' 
                : 'min-h-16 md:min-h-20 text-base md:text-lg'
            }`}
            style={{ 
              minHeight: isComposerFocused ? (window.innerWidth >= 768 ? '128px' : '96px') : (window.innerWidth >= 768 ? '80px' : '64px'),
              maxHeight: isComposerFocused ? '400px' : '200px'
            }}
          />
          
          {/* Preview de archivo - responsive CON PROPORCIONES ORIGINALES */}
          {previewUrl && (
            <div className="mt-3 md:mt-4 relative flex justify-center">
              {selectedFile?.type.startsWith('image') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className={`max-w-full object-contain rounded-xl border border-base-300 transition-all duration-300 ${
                    isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                  }`}
                />
              ) : (
                <div className={`bg-black rounded-xl transition-all duration-300 ${
                  isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                }`}>
                  <video 
                    src={previewUrl} 
                    controls 
                    className={`max-w-full object-contain rounded-xl transition-all duration-300 ${
                      isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                    }`}
                  />
                </div>
              )}
              <button 
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/60 hover:bg-black/80 border-none text-white backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Opciones y botón de post - responsive */}
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isComposerFocused ? 'mt-4 md:mt-6' : 'mt-2 md:mt-3'
          }`}>
            <div className="flex space-x-1 md:space-x-2 relative">
              {/* Botón para imagen */}
              <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group">
                <Camera className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              
              {/* Botón para video */}
              <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group">
                <Video className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Botón para emojis */}
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group"
              >
                <Smile className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute top-full left-0 z-50 mt-2"
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={300}
                    height={400}
                    theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'}
                    previewConfig={{
                      showPreview: false
                    }}
                    skinTonesDisabled
                  />
                </div>
              )}

              {/* Mostrar caracteres restantes cuando está focused - solo en desktop */}
              {isComposerFocused && (
                <div className="hidden md:flex items-center ml-4 text-sm text-base-content/60">
                  {newPost.length > 320 && (
                    <span className={`${isOverLimit ? 'text-error' : 'text-warning'}`}>
                      {400 - newPost.length} caracteres restantes
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Círculo de progreso - más pequeño en móvil */}
              <div className="relative w-6 h-6 md:w-8 md:h-8">
                <svg className="w-6 h-6 md:w-8 md:h-8 transform -rotate-90" viewBox="0 0 32 32">
                  {/* Círculo de fondo */}
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-base-300"
                  />
                  {/* Círculo de progreso */}
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
                {/* Número en el centro si está cerca del límite - solo en desktop */}
                {progressPercentage > 80 && (
                  <div className={`absolute inset-0 hidden md:flex items-center justify-center text-xs font-bold ${
                    isOverLimit ? 'text-error' : 'text-warning'
                  }`}>
                    {400 - newPost.length}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleCreatePost}
                disabled={(!newPost.trim() && !selectedFile) || isPosting || isOverLimit}
                className={`btn btn-primary rounded-full hover:scale-105 transition-all duration-300 disabled:opacity-50 ${
                  isComposerFocused ? 'btn-sm md:btn-md px-4 md:px-6' : 'btn-sm px-3 md:px-4'
                }`}
              >
                {isPosting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm md:text-base">Opinar</span>
                )}
              </button>
            </div>
          </div>

          {/* Botones adicionales cuando está focused - solo en desktop y no modal */}
          {isComposerFocused && !isModal && (
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