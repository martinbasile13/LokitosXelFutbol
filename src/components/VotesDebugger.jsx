import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

const VotesDebugger = () => {
  const { user } = useAuth()
  const [likesData, setLikesData] = useState([])
  const [totalLikes, setTotalLikes] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchLikes = async () => {
    setLoading(true)
    try {
      console.log('🔍 Obteniendo todos los likes/dislikes de la tabla post_likes...')
      
      // Obtener todos los likes/dislikes de la tabla
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('📊 Resultado query post_likes:', { likes, error })

      if (error) {
        console.error('❌ Error obteniendo likes:', error)
        setLikesData([])
        setTotalLikes(0)
        return
      }

      setLikesData(likes || [])
      
      // Obtener total count
      const { count, error: countError } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })

      if (!countError) {
        setTotalLikes(count || 0)
      }

      console.log('✅ Likes cargados:', likes?.length || 0, 'Total en DB:', count || 0)
    } catch (error) {
      console.error('💥 Error en fetchLikes:', error)
    } finally {
      setLoading(false)
    }
  }

  const testLike = async () => {
    if (!user?.id) {
      alert('Necesitas estar logueado para probar')
      return
    }

    setLoading(true)
    try {
      console.log('🧪 PRUEBA: Insertando like directamente...')
      
      const testData = {
        post_id: '4403d71e-7978-48ab-842a-7ecb25b5f0c9', // Un ID de post que existe
        user_id: user.id,
        is_like: true // true = like, false = dislike
      }

      const { data, error } = await supabase
        .from('post_likes')
        .insert(testData)
        .select()

      console.log('🧪 Resultado inserción directa:', { data, error })

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert(`¡Éxito! Like insertado: ${JSON.stringify(data)}`)
        fetchLikes() // Refrescar lista
      }
    } catch (error) {
      console.error('🧪 Error en prueba:', error)
      alert(`Error en prueba: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLikes()
  }, [])

  return (
    <div className="bg-error text-error-content p-4 rounded-lg m-4 text-sm">
      <h3 className="font-bold mb-2">🐛 Debug Likes (Tabla post_likes)</h3>
      <p className="mb-2"><strong>Total likes/dislikes en DB:</strong> {totalLikes}</p>
      <p className="mb-2"><strong>Usuario actual:</strong> {user?.id?.slice(0, 8) || 'No logueado'}...</p>
      
      {likesData.length > 0 ? (
        <div className="max-h-48 overflow-y-auto mb-3">
          <p className="font-semibold mb-1">Últimos 10 likes/dislikes:</p>
          {likesData.map((like, index) => (
            <div key={index} className="text-xs mb-1 p-2 bg-error-content text-error rounded">
              • Post: {like.post_id?.slice(0, 8)}... | 
              User: {like.user_id?.slice(0, 8)}... | 
              Tipo: <strong>{like.is_like ? '👍 Like' : '👎 Dislike'}</strong> | 
              Fecha: {new Date(like.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs mb-3">⚠️ NO HAY LIKES/DISLIKES EN LA TABLA</p>
      )}
      
      <div className="flex gap-2">
        <button 
          onClick={fetchLikes}
          disabled={loading}
          className="btn btn-xs btn-primary"
        >
          {loading ? '⏳' : '🔄'} Refrescar
        </button>
        <button 
          onClick={testLike}
          disabled={loading || !user?.id}
          className="btn btn-xs btn-secondary"
        >
          {loading ? '⏳' : '🧪'} Probar Like
        </button>
      </div>
    </div>
  )
}

export default VotesDebugger