import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useScrollRestore } from '../components/shared/hooks/useScrollPosition'
import { getPostThread, deleteReply } from '../services/posts'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'
import AppLayout from '../components/AppLayout'
import { MessageCircle, Loader2 } from 'lucide-react'

const PostDetail = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { restoreScrollPosition } = useScrollRestore()
  
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [replyCount, setReplyCount] = useState(0)

  // Función personalizada para volver atrás con restauración de scroll
  const handleGoBack = () => {
    navigate(-1)
    // Restaurar la posición después de la navegación
    setTimeout(() => {
      const previousPath = document.referrer?.includes('/para-ti') ? '/para-ti' : '/'
      restoreScrollPosition(previousPath)
    }, 200)
  }

  // Cargar post y thread completo
  useEffect(() => {
    if (postId) {
      loadPostThread()
    }
  }, [postId])

  const loadPostThread = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🧵 Cargando thread del post:', postId)
      
      const result = await getPostThread(postId, user?.id)
      
      if (result.success && result.data) {
        setPost(result.data)
        setReplies(result.data.replies || [])
        setReplyCount(result.data.replies_count || result.data.replies?.length || 0)
        
        console.log('✅ Thread cargado:', {
          post: result.data.id,
          replies: result.data.replies?.length || 0
        })
      } else {
        setError(result.error || 'Post no encontrado')
      }
    } catch (error) {
      console.error('💥 Error cargando thread:', error)
      setError('Error cargando el post')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar nueva reply creada desde PostComposer
  const handleReplyCreated = (newReply) => {
    setReplies(prev => [newReply, ...prev])
    setReplyCount(prev => prev + 1)
    
    // Actualizar contador en el post principal
    setPost(prev => ({
      ...prev,
      replies_count: (prev.replies_count || 0) + 1
    }))
  }

  // Manejar eliminación de reply
  const handleReplyDelete = async (replyId) => {
    try {
      const result = await deleteReply(replyId, user.id)
      
      if (result.success) {
        // Remover reply de la lista
        setReplies(prev => prev.filter(reply => reply.id !== replyId))
        setReplyCount(prev => Math.max(0, prev - 1))
        
        // Actualizar contador en el post principal
        setPost(prev => ({
          ...prev,
          replies_count: Math.max(0, (prev.replies_count || 0) - 1)
        }))
        
        return Promise.resolve()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error eliminando reply:', error)
      throw error
    }
  }

  return (
    <AppLayout 
      pageTitle="Post"
      showBackButton={true}
      onBackButton={handleGoBack}
      pageSubtitle={replyCount > 0 ? `${replyCount} respuesta${replyCount !== 1 ? 's' : ''}` : null}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-base-content/60">Cargando conversación...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <MessageCircle className="w-16 h-16 mx-auto text-base-content/30" />
            </div>
            <h2 className="text-xl font-bold text-base-content mb-2">
              Post no encontrado
            </h2>
            <p className="text-base-content/60 mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Post encontrado */}
      {!isLoading && !error && post && (
        <div className="max-w-2xl mx-auto">
          {/* Post principal */}
          <div className="border-b border-base-300">
            <PostCard
              post={post}
              isReply={false}
              onDelete={async (postId) => {
                // Si se elimina el post principal, redirigir al home
                await handleReplyDelete(postId)
                navigate('/')
              }}
            />
          </div>

          {/* Composer para responder */}
          {user && (
            <div className="border-b border-base-300 py-4">
              <PostComposer
                isReply={true}
                parentPost={post}
                onPostCreated={handleReplyCreated}
                placeholder={`Responder a @${post.profiles?.username}...`}
                compact={true}
              />
            </div>
          )}

          {/* Lista de respuestas SIN threading visual - como posts simples */}
          <div className="replies-list">
            {replies.map((reply, index) => (
              <div key={reply.id} className="border-b border-base-300">
                <PostCard
                  post={reply}
                  isReply={true}
                  replyLevel={0}
                  onDelete={handleReplyDelete}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default PostDetail