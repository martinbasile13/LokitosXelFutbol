import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from 'react-router-dom'
import PostCard from '../components/PostCard/index.jsx'
import PostComposer from '../components/PostComposer'
import AppLayout from '../components/AppLayout'
import { useInfiniteScroll } from '../components/shared/hooks/useInfiniteScroll'
import { useAutoScrollRestore } from '../components/shared/hooks/useScrollPosition'
import { getFeedPosts, deletePost } from '../services/posts'
import { Loader2 } from 'lucide-react'

const ParaTi = () => {
  const { user } = useAuth()
  const location = useLocation()

  // Hook para auto-restaurar scroll - REACTIVADO
  useAutoScrollRestore()

  // Configuración de tabs
  const tabs = [
    { 
      id: 'para-ti', 
      label: 'Para Ti',
      isActive: location.pathname === '/para-ti' || location.pathname === '/'
    },
    { 
      id: 'partidos', 
      label: 'Partidos',
      isActive: location.pathname === '/partidos'
    }
  ]

  // Función para cargar posts del feed
  const loadFeedPosts = async (limit, offset) => {
    try {
      return await getFeedPosts(limit, offset, user?.id)
    } catch (error) {
      console.error('Error cargando posts:', error)
      window.showErrorAlert?.('Error al cargar posts')
      return []
    }
  }

  // Hook de scroll infinito con persistencia global
  const {
    items: posts,
    loading,
    loadingMore,
    hasMore,
    loadInitial,
    addItem,
    removeItem,
    updateItem
  } = useInfiniteScroll({
    loadFunction: loadFeedPosts,
    bufferSize: 20,
    loadThreshold: 5,
    cleanupThreshold: 999999, // Deshabilitar limpieza automática
    postsPerLoad: 10,
    stateKey: 'para-ti-feed' // Clave única para persistir este feed
  })

  // Cargar posts SOLO si no hay posts persistidos
  useEffect(() => {
    if (user?.id && posts.length === 0) {
      console.log('🔄 No hay posts persistidos, cargando iniciales')
      loadInitial()
    } else if (posts.length > 0) {
      console.log('✅ Posts persistidos encontrados:', posts.length)
    }
  }, [user?.id])

  const handlePostCreated = (newPost) => {
    addItem(newPost)
  }

  const handleVoteUpdate = (postId, voteData) => {
    updateItem(postId, {
      upvotes: voteData.upvotes,
      downvotes: voteData.downvotes,
      upvotes_count: voteData.upvotes,
      downvotes_count: voteData.downvotes,
      user_vote: voteData.user_vote
    })
  }

  const handleViewUpdate = (postId, newViewCount) => {
    updateItem(postId, { views_count: newViewCount })
  }

  const handleDeletePost = async (postId) => {
    if (!user?.id) {
      window.showErrorAlert?.('Debes estar autenticado para eliminar posts')
      return
    }

    try {
      const result = await deletePost(postId, user.id)
      
      if (result.success) {
        removeItem(postId)
        window.showSuccessAlert?.('¡Post eliminado exitosamente!')
      } else {
        console.error('Error eliminando post:', result.error)
        window.showErrorAlert?.('Error al eliminar el post: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error eliminando post:', error)
      window.showErrorAlert?.('Error al eliminar el post')
    }
  }

  // Tabs personalizados usando el header del AppLayout
  const customHeader = (
    <div className="sticky top-0 bg-base-100/80 backdrop-blur border-b border-base-300 z-10">
      <div className="flex">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex-1 text-center py-3 md:py-4 hover:bg-base-200/50 transition-colors relative ${
              tab.isActive ? 'font-bold' : ''
            }`}
          >
            {tab.label}
            {tab.isActive && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <AppLayout
      customHeader={customHeader}
      onPostCreated={handlePostCreated}
      loading={loading}
      loadingText="Cargando posts..."
      empty={!loading && posts.length === 0}
      emptyIcon="⚽"
      emptyTitle="¡Bienvenido a Para Ti!"
      emptyMessage="Aquí verás los posts de la comunidad futbolera. ¡Sé el primero en crear un post!"
    >
      {/* Formulario para crear post */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Feed de posts */}
      <div>
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
        {!hasMore && posts.length > 0 && (
          <div className="p-8 text-center border-t border-base-300">
            <p className="text-base-content/70">¡Has visto todos los posts disponibles!</p>
            <p className="text-sm text-base-content/50 mt-1">Vuelve más tarde para ver contenido nuevo</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default ParaTi