import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

const VotesDebugger = () => {
  const { user } = useAuth()
  const [votesData, setVotesData] = useState([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchVotes = async () => {
    setLoading(true)
    try {
      console.log('🔍 Obteniendo todos los votos de la tabla post_votes...')
      
      // Obtener todos los votos de la tabla
      const { data: votes, error } = await supabase
        .from('post_votes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('📊 Resultado query post_votes:', { votes, error })

      if (error) {
        console.error('❌ Error obteniendo votos:', error)
        setVotesData([])
        setTotalVotes(0)
        return
      }

      setVotesData(votes || [])
      
      // Obtener total count
      const { count, error: countError } = await supabase
        .from('post_votes')
        .select('*', { count: 'exact', head: true })

      if (!countError) {
        setTotalVotes(count || 0)
      }

      console.log('✅ Votos cargados:', votes?.length || 0, 'Total en DB:', count || 0)
    } catch (error) {
      console.error('💥 Error en fetchVotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const testVote = async () => {
    if (!user?.id) {
      alert('Necesitas estar logueado para probar')
      return
    }

    setLoading(true)
    try {
      console.log('🧪 PRUEBA: Insertando voto directamente...')
      
      const testData = {
        post_id: '4403d71e-7978-48ab-842a-7ecb25b5f0c9', // Un ID de post que existe
        user_id: user.id,
        vote_type: 'up'
      }

      const { data, error } = await supabase
        .from('post_votes')
        .insert(testData)
        .select()

      console.log('🧪 Resultado inserción directa:', { data, error })

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert(`¡Éxito! Voto insertado: ${JSON.stringify(data)}`)
        fetchVotes() // Refrescar lista
      }
    } catch (error) {
      console.error('🧪 Error en prueba:', error)
      alert(`Error en prueba: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVotes()
  }, [])

  return (
    <div className="bg-error text-error-content p-4 rounded-lg m-4 text-sm">
      <h3 className="font-bold mb-2">🐛 Debug Votes (Tabla post_votes)</h3>
      <p className="mb-2"><strong>Total votos en DB:</strong> {totalVotes}</p>
      <p className="mb-2"><strong>Usuario actual:</strong> {user?.id?.slice(0, 8) || 'No logueado'}...</p>
      
      {votesData.length > 0 ? (
        <div className="max-h-48 overflow-y-auto mb-3">
          <p className="font-semibold mb-1">Últimos 10 votos:</p>
          {votesData.map((vote, index) => (
            <div key={index} className="text-xs mb-1 p-2 bg-error-content text-error rounded">
              • Post: {vote.post_id?.slice(0, 8)}... | 
              User: {vote.user_id?.slice(0, 8)}... | 
              Tipo: <strong>{vote.vote_type}</strong> | 
              Fecha: {new Date(vote.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs mb-3">⚠️ NO HAY VOTOS EN LA TABLA</p>
      )}
      
      <div className="flex gap-2">
        <button 
          onClick={fetchVotes}
          disabled={loading}
          className="btn btn-xs btn-primary"
        >
          {loading ? '⏳' : '🔄'} Refrescar
        </button>
        <button 
          onClick={testVote}
          disabled={loading || !user?.id}
          className="btn btn-xs btn-secondary"
        >
          {loading ? '⏳' : '🧪'} Probar Insert
        </button>
      </div>
    </div>
  )
}

export default VotesDebugger 