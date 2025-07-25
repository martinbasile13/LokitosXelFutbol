import { useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../UI/Avatar'
import { followUser } from '../../services/userService'

const SuggestedUsers = ({ 
  user,
  suggestedUsers, 
  setSuggestedUsers,
  loadingUsers, 
  userStats,
  setUserStats,
  onReloadSuggestions
}) => {
  const [followingStates, setFollowingStates] = useState({})

  const handleFollowUser = async (userToFollowId) => {
    try {
      console.log('Intentando seguir usuario:', userToFollowId, 'desde usuario:', user.id)
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: true }))
      
      const result = await followUser(user.id, userToFollowId)
      console.log('Resultado de followUser:', result)
      
      if (result.success) {
        console.log('Usuario seguido exitosamente, removiendo de la lista')
        setSuggestedUsers(prev => prev.filter(u => u.id !== userToFollowId))
        setUserStats(prev => ({ ...prev, following: prev.following + 1 }))
        setTimeout(() => {
          onReloadSuggestions()
        }, 1000)
      } else {
        console.error('Error en followUser:', result.error)
        setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
        alert('Error al seguir usuario: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error siguiendo usuario:', error)
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
      alert('Error al seguir usuario: ' + error.message)
    }
  }

  return (
    <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
      <div className="p-3">
        <h2 className="text-lg font-bold mb-2">A quién seguir</h2>
        <div className="space-y-2">
          {loadingUsers ? (
            <div className="py-2 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
            </div>
          ) : suggestedUsers.length > 0 ? (
            suggestedUsers.map((suggestedUser) => (
              <div key={suggestedUser.id} className="flex items-center justify-between py-1">
                <Link 
                  to={`/user/${suggestedUser.id}`}
                  className="flex items-center space-x-2 flex-1 hover:bg-base-300/50 p-1 rounded-lg transition-colors"
                >
                  <Avatar 
                    src={suggestedUser.avatar_url}
                    alt={suggestedUser.username || 'Usuario'}
                    name={suggestedUser.username || 'Usuario'}
                    team={suggestedUser.team}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{suggestedUser.username}</p>
                    <p className="text-xs text-base-content/60 truncate">@{suggestedUser.username?.toLowerCase()}</p>
                    {suggestedUser.team && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-base-content/60">⚽ {suggestedUser.team}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <button 
                  onClick={() => handleFollowUser(suggestedUser.id)}
                  disabled={followingStates[suggestedUser.id]}
                  className="btn btn-xs rounded-full bg-white text-black hover:bg-gray-200 border-gray-300 ml-2 flex-shrink-0"
                >
                  Seguir
                </button>
              </div>
            ))
          ) : (
            <div className="py-2 text-center text-base-content/60">
              <UserPlus className="w-4 h-4 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No hay usuarios sugeridos</p>
            </div>
          )}
          <Link 
            to="/a-quien-seguir"
            className="text-primary hover:underline text-xs pt-1 block"
          >
            Mostrar más
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SuggestedUsers