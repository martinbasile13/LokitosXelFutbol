import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import Avatar from '../components/Avatar'
import { validateFile } from '../services/mediaService'
import { getFeedPosts, createPost, deletePost } from '../services/postService'

const ParaTi = () => {
  const { user, userProfile } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      const feedPosts = await getFeedPosts(20)
      console.log('Posts cargados:', feedPosts)
      setPosts(feedPosts)
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validation = validateFile(file, 'image')
      if (validation.valid) {
        setSelectedImage(file)
        setSelectedVideo(null)
      } else {
        alert(validation.error)
      }
    }
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validation = validateFile(file, 'video')
      if (validation.valid) {
        setSelectedVideo(file)
        setSelectedImage(null)
      } else {
        alert(validation.error)
      }
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage && !selectedVideo) {
      alert('Escribe algo o selecciona una imagen/video')
      return
    }

    if (!user?.id) {
      alert('Debes estar autenticado para crear un post')
      return
    }

    setIsPosting(true)

    try {
      // Por ahora creamos el post solo con texto
      // TODO: Implementar subida de imagen/video a Cloudflare
      const postData = {
        user_id: user.id,
        content: newPost,
        title: '', // Por ahora sin título
        image_url: null, // TODO: URL de Cloudflare
        video_url: null  // TODO: URL de Cloudflare
      }

      console.log('Creando post con datos:', postData)
      const result = await createPost(postData)
      console.log('Resultado del post:', result)
      
      if (result.success) {
        // Agregar el nuevo post al inicio de la lista
        setPosts(prev => [result.data, ...prev])
        
        // Limpiar formulario
        setNewPost('')
        setSelectedImage(null)
        setSelectedVideo(null)
        
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
        // Remover el post de la lista
        setPosts(prev => prev.filter(post => post.id !== postId))
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
              
              {/* Header */}
              <div className="sticky top-16 bg-base-100/80 backdrop-blur border-b border-base-300 p-4 z-10">
                <h1 className="text-xl font-bold">Para Ti</h1>
              </div>

              {/* Formulario para crear post */}
              <div className="border-b border-base-300 p-4">
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
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="¿Qué está pasando en el fútbol?"
                      className="textarea textarea-ghost w-full min-h-24 text-lg resize-none focus:outline-none"
                      maxLength={280}
                    />
                    
                    {/* Preview de imagen */}
                    {selectedImage && (
                      <div className="mt-2 relative">
                        <img 
                          src={URL.createObjectURL(selectedImage)} 
                          alt="Preview" 
                          className="max-h-48 w-full object-cover rounded-lg"
                        />
                        <button 
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Preview de video */}
                    {selectedVideo && (
                      <div className="mt-2 relative">
                        <video 
                          src={URL.createObjectURL(selectedVideo)} 
                          controls 
                          className="max-h-48 w-full rounded-lg"
                        />
                        <button 
                          onClick={() => setSelectedVideo(null)}
                          className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Opciones y botón de post */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex space-x-2">
                        {/* Botón para imagen */}
                        <label className="btn btn-ghost btn-circle btn-sm">
                          <span className="text-lg">🖼️</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                        
                        {/* Botón para video */}
                        <label className="btn btn-ghost btn-circle btn-sm">
                          <span className="text-lg">🎥</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            className="hidden"
                          />
                        </label>
                        
                        {/* Botón para emoji */}
                        <button className="btn btn-ghost btn-circle btn-sm">
                          <span className="text-lg">😀</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`text-sm ${newPost.length > 260 ? 'text-error' : 'text-base-content/70'}`}>
                          {280 - newPost.length}
                        </span>
                        
                        <button
                          onClick={handleCreatePost}
                          disabled={(!newPost.trim() && !selectedImage && !selectedVideo) || isPosting}
                          className="btn btn-primary btn-sm rounded-full"
                        >
                          {isPosting ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            'Opinar'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed de posts */}
              <div className="pb-20">
                {loadingPosts ? (
                  <div className="p-8 text-center">
                    <span className="loading loading-spinner loading-md"></span>
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
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUser={user}
                      onDelete={handleDeletePost}
                    />
                  ))
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