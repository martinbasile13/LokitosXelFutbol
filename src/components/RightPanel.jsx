import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getSuggestedUsers, followUser, getUserStats } from '../services/userService'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import SearchBox from './SearchBox'
import { 
  UserPlus, 
  Loader2,
  LogOut,
  MoreHorizontal,
  User
} from 'lucide-react'
import { Link } from 'react-router-dom'

const RightPanel = () => {
  const { user, userProfile, signOut } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [userStats, setUserStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [followingStates, setFollowingStates] = useState({})
  
  // Estados para el dropdown del perfil
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef(null)

  const trends = [
    { topic: '#Boca', posts: '45.2K posts' },
    { topic: '#River', posts: '38.7K posts' },
    { topic: '#PrimeraDivisión', posts: '25.1K posts' },
  ]

  useEffect(() => {
    if (user?.id) {
      loadSuggestedUsers()
      loadUserStats()
    }
  }, [user])

  const loadSuggestedUsers = async () => {
    try {
      setLoadingUsers(true)
      const users = await getSuggestedUsers(user.id, 2)
      setSuggestedUsers(users)
    } catch (error) {
      console.error('Error cargando usuarios sugeridos:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const stats = await getUserStats(user.id)
      setUserStats(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

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
          loadSuggestedUsers()
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

  const getDisplayName = (profile) => {
    return profile?.username || 'Usuario'
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const confirmed = await window.showConfirm({
      title: '¿Cerrar sesión?',
      message: '¿Estás seguro que quieres cerrar sesión?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      type: 'warning'
    })

    if (confirmed) {
      try {
        const { error } = await signOut()
        if (!error) {
          window.showSuccessAlert('Sesión cerrada exitosamente')
        } else {
          console.error('Error cerrando sesión:', error)
          window.showErrorAlert('Error al cerrar sesión')
        }
      } catch (error) {
        console.error('Error cerrando sesión:', error)
        window.showErrorAlert('Error al cerrar sesión')
      }
    }
  }

  return (
    <div className="sticky top-0 h-screen overflow-y-auto">
      <div className="p-2 space-y-4">
        
        {/* Barra de búsqueda estilo Twitter */}
        <SearchBox />

        {/* Perfil del usuario actual - CON DROPDOWN EN LOS TRES PUNTITOS */}
        {user && userProfile && (
          <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300 relative" ref={profileDropdownRef}>
            {/* Header azul (placeholder para imagen posterior) */}
            <div className="h-16 bg-primary"></div>
            
            {/* Contenido del perfil */}
            <div className="p-4 -mt-8">
              {/* Layout horizontal: Avatar izquierda, info derecha */}
              <div className="flex items-start space-x-3 mb-3">
                {/* Avatar a la izquierda - CIRCULAR */}
                <div className="w-16 h-16 border-4 border-base-100 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile?.username || 'Usuario'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(userProfile?.username || 'Usuario').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Info en el medio */}
                <div className="flex-1 pt-4">
                  <h3 className="font-bold text-base text-white">{getDisplayName(userProfile)}</h3>
                  <p className="text-base-content/60 text-sm">@{userProfile?.username?.toLowerCase() || 'usuario'}</p>
                </div>

                {/* Icono de menú y badge del equipo */}
                <div className="flex items-center space-x-2 pt-4">
                  {userProfile?.team && (
                    <>
                      <TeamBadge team={userProfile.team} size="md" />
                      <span className="text-xs text-primary font-medium leading-none">
                        {userProfile.team}
                      </span>
                    </>
                  )}
                  {/* BOTÓN DE TRES PUNTITOS FUNCIONAL */}
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors ml-2"
                  >
                    <MoreHorizontal className="w-6 h-6 text-base-content/60" />
                  </button>
                </div>
              </div>
              
              {/* Estadísticas en fila horizontal compacta - XP EN LUGAR DE POSTS */}
              <div className="flex justify-between text-center">
                <div>
                  <div className="font-bold text-primary text-lg">{userProfile?.experience_points || 0}</div>
                  <div className="text-base-content/70 text-xs">XP</div>
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">{userStats.followers}</div>
                  <div className="text-base-content/70 text-xs">Seguidores</div>
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">{userStats.following}</div>
                  <div className="text-base-content/70 text-xs">Siguiendo</div>
                </div>
              </div>
            </div>

            {/* Dropdown estilo Twitter - LIMPIO Y ELEGANTE */}
            {showProfileDropdown && (
              <div 
                className="fixed top-20 right-4 bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden min-w-64"
                style={{ 
                  zIndex: 99999,
                  position: 'fixed',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div className="py-2">
                  {/* Información del usuario en el dropdown */}
                  <div className="px-4 py-3 border-b border-base-300">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        src={userProfile?.avatar_url}
                        alt={userProfile?.username || 'Usuario'}
                        name={userProfile?.username || 'Usuario'}
                        team={userProfile?.team}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{userProfile?.username}</p>
                        <p className="text-xs text-base-content/60 truncate">@{userProfile?.username?.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones del menú */}
                  <div className="py-1">
                    <Link 
                      to="/perfil"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-base-200 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <User className="w-4 h-4 text-base-content/60" />
                      </div>
                      <span className="text-sm font-medium">Ver perfil</span>
                    </Link>

                    <div className="border-t border-base-300 my-1"></div>

                    <button 
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-base-200 transition-colors w-full text-left text-error"
                      onClick={() => {
                        setShowProfileDropdown(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Cerrar sesión @{userProfile?.username}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* What's happening - Tendencias estilo Twitter - MÁS COMPACTO */}
        <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
          <div className="p-3">
            <h2 className="text-lg font-bold mb-2">Tendencias en fútbol</h2>
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={index} className="cursor-pointer hover:bg-base-200/50 p-1.5 -m-1.5 rounded-lg transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-base-content/60">Tendencia en Argentina</p>
                      <p className="font-bold text-sm text-primary">{trend.topic}</p>
                      <p className="text-xs text-base-content/60">{trend.posts}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-primary hover:underline text-xs pt-1">
                Mostrar más
              </button>
            </div>
          </div>
        </div>

        {/* Who to follow - A quién seguir estilo Twitter - MÁS COMPACTO */}
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
      </div>
    </div>
  )
}

export default RightPanel
