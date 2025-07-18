import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { addPostView } from '../services/postService'
import { useAuth } from '../context/AuthContext'

const ViewsDebugger = ({ postId }) => {
  const { user } = useAuth()
  const [viewsData, setViewsData] = useState([])
  const [totalViews, setTotalViews] = useState(0)
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (postId) {
      fetchViews()
      // Refrescar cada 3 segundos
      const interval = setInterval(fetchViews, 3000)
      return () => clearInterval(interval)
    }
  }, [postId])

  const fetchViews = async () => {
    try {
      console.log('🔍 Buscando vistas para post:', postId)
      
      // Obtener todas las vistas del post
      const { data: views, error } = await supabase
        .from('post_views')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      console.log('📊 Resultado query vistas:', { views, error })

      if (error) {
        console.error('❌ Error obteniendo vistas:', error)
        setViewsData([])
        setTotalViews(0)
        return
      }

      setViewsData(views || [])
      setTotalViews(views?.length || 0)
      console.log('✅ Vistas cargadas:', views?.length || 0)
    } catch (error) {
      console.error('💥 Error en fetchViews:', error)
    }
  }

  const testAddView = async () => {
    setIsRegistering(true)
    try {
      console.log('🧪 PRUEBA MANUAL: Registrando vista...')
      const result = await addPostView(postId, user?.id)
      console.log('🧪 RESULTADO PRUEBA:', result)
      alert(`Resultado: ${result.success ? 'ÉXITO' : 'ERROR'} - ${result.message || result.error || 'Sin mensaje'}`)
      
      // Refrescar vistas después de la prueba
      setTimeout(fetchViews, 1000)
    } catch (error) {
      console.error('🧪 ERROR EN PRUEBA:', error)
      alert(`Error en prueba: ${error.message}`)
    } finally {
      setIsRegistering(false)
    }
  }

  if (!postId) return null

  return (
    <div className="bg-warning text-warning-content p-4 rounded-lg mt-4 text-sm">
      <h3 className="font-bold mb-2">🐛 Debug Views (Post: {postId})</h3>
      <p className="mb-2"><strong>Total views:</strong> {totalViews}</p>
      
      {viewsData.length > 0 ? (
        <div className="max-h-32 overflow-y-auto">
          <p className="font-semibold mb-1">Últimas vistas:</p>
          {viewsData.slice(0, 5).map((view, index) => (
            <div key={index} className="text-xs mb-1">
              • {view.user_id ? `User: ${view.user_id.slice(0, 8)}...` : 'Anónimo'} - {new Date(view.created_at).toLocaleTimeString()}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs">No hay vistas registradas aún</p>
      )}
      
      <div className="flex gap-2 mt-2">
        <button 
          onClick={fetchViews}
          className="btn btn-xs btn-primary"
        >
          🔄 Refrescar
        </button>
        <button 
          onClick={testAddView}
          disabled={isRegistering}
          className="btn btn-xs btn-secondary"
        >
          {isRegistering ? '⏳' : '🧪'} Probar Vista
        </button>
      </div>
    </div>
  )
}

export default ViewsDebugger 