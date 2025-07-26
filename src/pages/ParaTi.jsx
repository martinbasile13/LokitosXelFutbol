import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard/index.jsx'
import PostComposer from '../components/PostComposer'
import AppLayout from '../components/AppLayout'
import { getFeedPosts, deletePost } from '../services/posts'
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
  
  // Estados para scroll infinito inteligente
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const scrollContainerRef = useRef(null)
  const isLoadingRef = useRef(false)
  
  // Configuración del buffer inteligente
  const BUFFER_SIZE = 20 // Máximo de posts en memoria
  const LOAD_THRESHOLD = 5 // Cargar más cuando queden 5 posts por ver
  const CLEANUP_THRESHOLD = 25 // Limpiar cuando superamos 25 posts
  const POSTS_PER_LOAD = 10 // Cantidad de posts a cargar cada vez

  useEffect(() => {
    if (user?.id) {
      loadInitialPosts()
    }
  }, [user?.id])

  // Configurar intersection observer para detectar scroll en la ventana
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index)
            const remaining = posts.length - index - 1
            
            // Cargar más posts cuando queden pocos por ver
            if (remaining <= LOAD_THRESHOLD && hasMorePosts && !isLoadingRef.current) {
              loadMorePosts()
            }
          }
        })
      },
      {
        root: null, // null = usar el viewport de la ventana
        rootMargin: '200px',
        threshold: 0.1
      }
    )

    // Observar los últimos posts
    const postElements = document.querySelectorAll('[data-index]')
    const lastFewPosts = Array.from(postElements).slice(-LOAD_THRESHOLD)
    lastFewPosts.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [posts, hasMorePosts])

  const loadInitialPosts = async () => {
    try {
      setLoadingPosts(true)
      isLoadingRef.current = true
      
      const feedPosts = await getFeedPosts(BUFFER_SIZE, 0, user?.id)
      setPosts(feedPosts)
      setCurrentOffset(BUFFER_SIZE)
      setHasMorePosts(feedPosts.length === BUFFER_SIZE)
      
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoadingPosts(false)
      isLoadingRef.current = false
    }
  }

  const loadMorePosts = useCallback(async () => {
    if (isLoadingRef.current || !hasMorePosts) return
    
    try {
      setLoadingMore(true)
      isLoadingRef.current = true
      
      const newPosts = await getFeedPosts(POSTS_PER_LOAD, currentOffset, user?.id)
      
      if (newPosts.length === 0) {
        setHasMorePosts(false)
        return
      }

      setPosts(prevPosts => {
        const updatedPosts = [...prevPosts, ...newPosts]
        
        // Limpiar posts antiguos si superamos el threshold
        if (updatedPosts.length > CLEANUP_THRESHOLD) {
          const postsToRemove = updatedPosts.length - BUFFER_SIZE
          const cleanedPosts = updatedPosts.slice(postsToRemove)
          
          // Ajustar el offset para mantener continuidad
          setCurrentOffset(prev => prev + POSTS_PER_LOAD)
          
          // Preservar posición de scroll aproximada
          requestAnimationFrame(() => {
            const container = scrollContainerRef.current
            if (container) {
              const scrollPosition = container.scrollTop
              const totalHeight = container.scrollHeight
              const viewportHeight = container.clientHeight
              
              // Mantener proporción del scroll
              const scrollRatio = scrollPosition / (totalHeight - viewportHeight)
              setTimeout(() => {
                const newTotalHeight = container.scrollHeight
                const newViewportHeight = container.clientHeight
                const newScrollPosition = scrollRatio * (newTotalHeight - newViewportHeight)
                container.scrollTop = Math.max(0, newScrollPosition)
              }, 50)
            }
          })
          
          return cleanedPosts
        }
        
        setCurrentOffset(prev => prev + POSTS_PER_LOAD)
        return updatedPosts
      })
      
      setHasMorePosts(newPosts.length === POSTS_PER_LOAD)
      
    } catch (error) {
      console.error('Error cargando más posts:', error)
    } finally {
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [currentOffset, hasMorePosts, user?.id])

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
    <AppLayout>
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

      {/* Feed de posts - SIN scroll container propio */}
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
            {posts.map((post, index) => (
              <div key={`${post.id}-${index}`} data-index={index}>
                <PostCard 
                  post={post}
                  onDelete={handleDeletePost} 
                  onVoteUpdate={handleVoteUpdate}
                  onViewUpdate={handleViewUpdate}
                />
              </div>
            ))}
            
            {/* Indicador de carga de más posts */}
            {loadingMore && (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-sm text-base-content/70">Cargando más posts...</p>
              </div>
            )}
            
            {/* Mensaje de fin de posts */}
            {!hasMorePosts && posts.length > 0 && (
              <div className="p-8 text-center border-t border-base-300">
                <p className="text-base-content/70">¡Has visto todos los posts disponibles!</p>
                <p className="text-sm text-base-content/50 mt-1">Vuelve más tarde para ver contenido nuevo</p>
              </div>
            )}
          </div>
        )}
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
    </AppLayout>
  )
}

export default ParaTi