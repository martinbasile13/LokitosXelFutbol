import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import Avatar from '../components/Avatar'
import { validateFile } from '../services/mediaService'
import { getFeedPosts, createPost, deletePost } from '../services/postService'
import { 
  Camera, 
  Video, 
  X, 
  Loader2 
} from 'lucide-react'

const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT || 'https://falling-boat-f7d7.basiledev-oficial.workers.dev/upload';

const ParaTi = () => {
  const { user, userProfile } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [isComposerFocused, setIsComposerFocused] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      loadPosts()
    }
  }, [user?.id])

  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      const feedPosts = await getFeedPosts(20, 0, user?.id)
      console.log('Posts cargados:', feedPosts)
      setPosts(feedPosts)
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

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
        // Recargar posts para obtener contadores actualizados
        await loadPosts()
        
        // Limpiar formulario
        setNewPost('')
        setSelectedFile(null)
        setPreviewUrl(null)
        
        alert('¡Post creado exitosamente!')
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

  const handleDeletePost = async (postId) => {
    if (!user?.id) {
      alert('Debes estar autenticado para eliminar posts')
      return
    }

    try {
      const result = await deletePost(postId, user.id)
      
      if (result.success) {
        // Recargar posts para obtener contadores actualizados
        await loadPosts()
        alert('Post eliminado exitosamente')
      } else {
        console.error('Error eliminando post:', result.error)
        alert('Error al eliminar el post: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error eliminando post:', error)
      alert('Error al eliminar el post')
    }
  }

  // Calcular el progreso del círculo (0-100)
  const progressPercentage = Math.min((newPost.length / 400) * 100, 100)
  const isOverLimit = newPost.length > 400

  const handleComposerFocus = () => {
    setIsComposerFocused(true)
  }

  const handleComposerBlur = () => {
    // Solo ocultar si no hay contenido ni archivo seleccionado
    if (!newPost.trim() && !selectedFile) {
      setIsComposerFocused(false)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newPost])

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-4">
          
          {/* Sidebar - Solo visible en desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="col-span-1 lg:col-span-6">
            <div className="min-h-screen border-x border-base-300">
              
              {/* Formulario para crear post */}
              <div className={`border-b border-base-300 transition-all duration-300 ${
                isComposerFocused 
                  ? 'p-6 bg-base-100 sticky top-16 z-20 shadow-lg border-l-4 border-l-primary' 
                  : 'p-4'
              }`}>
                <div className="flex space-x-3">
                  <Avatar 
                    src={userProfile?.avatar_url || user?.user_metadata?.avatar_url}
                    alt={userProfile?.username || 'Usuario'}
                    name={userProfile?.username || 'Usuario'}
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
                      placeholder="¿Qué está pasando en el fútbol?"
                      className={`textarea textarea-ghost w-full text-lg resize-none focus:outline-none overflow-hidden transition-all duration-200 ${
                        isComposerFocused 
                          ? 'min-h-32 text-xl placeholder:text-base-content/40' 
                          : 'min-h-24'
                      }`}
                      style={{ 
                        minHeight: isComposerFocused ? '128px' : '96px',
                        maxHeight: isComposerFocused ? '400px' : '200px'
                      }}
                    />
                    
                    {/* Preview de archivo */}
                    {previewUrl && (
                      <div className="mt-4 relative">
                        {selectedFile?.type.startsWith('image') ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className={`w-full object-cover rounded-xl border border-base-300 transition-all duration-300 ${
                              isComposerFocused ? 'max-h-80' : 'max-h-48'
                            }`}
                          />
                        ) : (
                          <video 
                            src={previewUrl} 
                            controls 
                            className={`w-full rounded-xl border border-base-300 transition-all duration-300 ${
                              isComposerFocused ? 'max-h-80' : 'max-h-48'
                            }`}
                          />
                        )}
                        <button 
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewUrl(null)
                          }}
                          className="absolute top-3 right-3 btn btn-circle btn-sm bg-black/60 hover:bg-black/80 border-none text-white backdrop-blur-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Opciones y botón de post */}
                    <div className={`flex items-center justify-between transition-all duration-300 ${
                      isComposerFocused ? 'mt-6' : 'mt-4'
                    }`}>
                      <div className="flex space-x-2">
                        {/* Botón para imagen */}
                        <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group">
                          <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                        
                        {/* Botón para video */}
                        <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group">
                          <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>

                        {/* Mostrar caracteres restantes cuando está focused */}
                        {isComposerFocused && (
                          <div className="flex items-center ml-4 text-sm text-base-content/60">
                            {newPost.length > 320 && (
                              <span className={`${isOverLimit ? 'text-error' : 'text-warning'}`}>
                                {400 - newPost.length} caracteres restantes
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Círculo de progreso */}
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
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
                          {/* Número en el centro si está cerca del límite */}
                          {progressPercentage > 80 && (
                            <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                              isOverLimit ? 'text-error' : 'text-warning'
                            }`}>
                              {400 - newPost.length}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={handleCreatePost}
                          disabled={(!newPost.trim() && !selectedFile) || isPosting || isOverLimit}
                          className={`btn btn-primary btn-sm rounded-full hover:scale-105 transition-all duration-300 disabled:opacity-50 ${
                            isComposerFocused ? 'btn-md px-6' : ''
                          }`}
                        >
                          {isPosting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Opinar'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Botones adicionales cuando está focused */}
                    {isComposerFocused && (
                      <div className="mt-4 pt-4 border-t border-base-300 flex justify-between items-center">
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

              {/* Feed de posts */}
              <div className={`pb-20 transition-all duration-300 ${
                isComposerFocused ? 'mt-4' : ''
              }`}>
                {loadingPosts ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-base-content/70">Cargando posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="max-w-sm mx-auto">
                      <h3 className="text-xl font-bold mb-2">¡Bienvenido a Para Ti!</h3>
                      <p className="text-base-content/70 mb-4">
                        Aquí verás los posts de la comunidad futbolera. 
                        ¡Sé el primero en crear un post!
                      </p>
                      <div className="text-6xl mb-4">⚽</div>
                    </div>
                  </div>
                ) : (
                  <div className="">
                    {posts.map((post) => (
                      <PostCard 
                        key={post.id} 
                        post={post}
                        onDelete={handleDeletePost} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Solo visible en desktop */}
          <div className="hidden xl:block xl:col-span-3">
            <div className="sticky top-20">
              <RightPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation para móvil */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
        <div className="grid grid-cols-5 text-center">
          <button className="p-4 hover:bg-base-200">
            <span className="text-xl">🏠</span>
          </button>
          <button className="p-4 hover:bg-base-200">
            <span className="text-xl">🔍</span>
          </button>
          <button className="p-4 hover:bg-base-200">
            <span className="text-xl">🔔</span>
          </button>
          <button className="p-4 hover:bg-base-200">
            <span className="text-xl">✉️</span>
          </button>
          <button className="p-4 hover:bg-base-200">
            <span className="text-xl">👤</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ParaTi