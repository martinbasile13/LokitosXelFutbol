import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import { getFeedPosts, deletePost } from '../services/postService'
import { Link, useLocation } from 'react-router-dom'
import { 
  Loader2,
  X
} from 'lucide-react'

const ParaTi = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [showPostModal, setShowPostModal] = useState(false)

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

  const handlePostCreated = async (newPost) => {
    // Agregar el nuevo post al principio de la lista con contadores inicializados
    setPosts(prevPosts => [newPost, ...prevPosts])
    setShowPostModal(false)
  }

  const handleVoteUpdate = (postId, voteData) => {
    // Actualizar el post específico con los nuevos datos de votos
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              upvotes: voteData.upvotes || post.upvotes,
              downvotes: voteData.downvotes || post.downvotes,
              upvotes_count: voteData.upvotes || post.upvotes_count,
              downvotes_count: voteData.downvotes || post.downvotes_count,
              user_vote: voteData.user_vote
            }
          : post
      )
    )
  }

  const handleViewUpdate = (postId, newViewCount) => {
    // Actualizar el contador de vistas del post específico
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              views_count: newViewCount
            }
          : post
      )
    )
  }

  const handleDeletePost = async (postId) => {
    console.log('🗑️ Eliminando post:', postId)
    
    if (!user?.id) {
      window.showErrorAlert('Debes estar autenticado para eliminar posts')
      return
    }

    try {
      const result = await deletePost(postId, user.id)
      
      if (result.success) {
        // Remover el post del estado local
        setPosts(prev => prev.filter(post => post.id !== postId))
        window.showSuccessAlert('¡Post eliminado exitosamente!')
      } else {
        console.error('Error eliminando post:', result.error)
        window.showErrorAlert('Error al eliminar el post: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error eliminando post:', error)
      window.showErrorAlert('Error al eliminar el post')
    }
  }

  return (
    <>
      <div className="min-h-screen bg-base-100 flex justify-center">
        {/* Contenedor principal centrado */}
        <div className="flex w-full max-w-7xl">
          {/* Sidebar estilo Twitter - hidden en móvil */}
          <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
            <Sidebar onOpenPostModal={() => setShowPostModal(true)} />
          </div>

          {/* Contenido principal estilo Twitter - responsive */}
          <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0">
            {/* Header con tabs estilo Twitter */}
            <div className="sticky top-0 bg-base-100/80 backdrop-blur border-b border-base-300 z-10">
              <div className="flex">
                <Link 
                  to="/para-ti" 
                  className={`flex-1 text-center py-3 md:py-4 hover:bg-base-200/50 transition-colors relative ${
                    location.pathname === '/para-ti' || location.pathname === '/' ? 'font-bold' : ''
                  }`}
                >
                  Para Ti
                  {(location.pathname === '/para-ti' || location.pathname === '/') && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary rounded-full"></div>
                  )}
                </Link>
                <Link 
                  to="/partidos" 
                  className={`flex-1 text-center py-3 md:py-4 hover:bg-base-200/50 transition-colors relative ${
                    location.pathname === '/partidos' ? 'font-bold' : ''
                  }`}
                >
                  Partidos
                  {location.pathname === '/partidos' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary rounded-full"></div>
                  )}
                </Link>
              </div>
            </div>

            {/* Formulario para crear post usando el componente reutilizable */}
            <PostComposer onPostCreated={handlePostCreated} />

            {/* Feed de posts - responsive padding */}
            <div className="pb-16 md:pb-20">
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
                      onVoteUpdate={handleVoteUpdate}
                      onViewUpdate={handleViewUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho estilo Twitter - solo visible en pantallas grandes */}
          <div className="hidden lg:block lg:w-96 p-4">
            <RightPanel />
          </div>

          {/* Navegación móvil fija abajo */}
          <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 md:hidden z-50">
            <div className="flex justify-around py-2">
              <Link 
                to="/para-ti" 
                className={`flex flex-col items-center p-2 ${
                  location.pathname === '/para-ti' || location.pathname === '/' ? 'text-primary' : 'text-base-content/60'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Inicio</span>
              </Link>
              <Link 
                to="/explorar" 
                className={`flex flex-col items-center p-2 ${
                  location.pathname === '/explorar' ? 'text-primary' : 'text-base-content/60'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span className="text-xs mt-1">Buscar</span>
              </Link>
              <Link 
                to="/notificaciones" 
                className={`flex flex-col items-center p-2 ${
                  location.pathname === '/notificaciones' ? 'text-primary' : 'text-base-content/60'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 17H1l5 5v-5z"/>
                </svg>
                <span className="text-xs mt-1">Notif</span>
              </Link>
              <Link 
                to="/perfil" 
                className={`flex flex-col items-center p-2 ${
                  location.pathname === '/perfil' ? 'text-primary' : 'text-base-content/60'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Perfil</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear post - CON BACKDROP BLUR CORRECTO */}
      {showPostModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowPostModal(false)}
          ></div>
          
          <div className="relative bg-base-100 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-base-300">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h3 className="font-bold text-lg">Crear post</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowPostModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-0">
              <PostComposer 
                isModal={true}
                onPostCreated={handlePostCreated}
                onClose={() => setShowPostModal(false)}
                placeholder="¿Qué está pasando en el fútbol?"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ParaTi