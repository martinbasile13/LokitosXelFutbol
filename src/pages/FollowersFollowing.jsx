import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import Avatar from '../components/UI/Avatar'
import TeamBadge from '../components/UI/TeamBadge'
import { 
  getUserFollowers, 
  getUserFollowing, 
  getUserProfileByHandle,
  followUser,
  unfollowUser,
  isFollowing
} from '../services/userService'
import { 
  Loader2, 
  UserPlus, 
  UserMinus, 
  ArrowLeft 
} from 'lucide-react'

const FollowersFollowing = () => {
  const { userHandle } = useParams() // Solo userHandle es parámetro
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // Extraer tab del pathname directamente
  const pathname = window.location.pathname
  const tab = pathname.endsWith('/followers') ? 'followers' : 
             pathname.endsWith('/following') ? 'following' : null
  
  const [targetUser, setTargetUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingStates, setFollowingStates] = useState({})
  const [followingData, setFollowingData] = useState({}) // Para saber quién sigue el usuario actual
  
  // DEBUG: Logging detallado de parámetros y navegación
  console.log('🔍 FollowersFollowing DEBUG:', {
    userHandle,
    tab,
    pathname,
    currentPath: window.location.pathname,
    currentUrl: window.location.href,
    useParamsResult: useParams()
  })
  
  // Validar que el tab sea válido
  const isValidTab = tab === 'followers' || tab === 'following'
  
  console.log('✅ Tab validation:', { tab, isValidTab })
  
  useEffect(() => {
    if (!isValidTab) {
      console.log('❌ Tab inválido:', tab, '- Redirigiendo al inicio')
      navigate('/para-ti')
      return
    }
    
    if (userHandle && currentUser?.id) {
      console.log('✅ Cargando datos para:', { userHandle, tab, currentUserId: currentUser.id })
      loadData()
    } else {
      console.log('❌ Datos faltantes:', { userHandle, currentUserId: currentUser?.id })
    }
  }, [userHandle, tab, currentUser?.id, isValidTab])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Iniciando carga de datos...')
      
      // 1. Obtener perfil del usuario objetivo
      console.log('👤 Obteniendo perfil para handle:', userHandle)
      const userProfile = await getUserProfileByHandle(userHandle)
      if (!userProfile) {
        console.log('❌ Usuario no encontrado:', userHandle)
        setTargetUser(null)
        setLoading(false)
        return
      }
      
      console.log('✅ Usuario encontrado:', userProfile)
      setTargetUser(userProfile)
      
      // 2. REHABILITADO - Cargar seguidores o seguidos según el tab
      console.log('✅ REHABILITANDO carga de followers/following')
      let userData = []
      
      try {
        if (tab === 'followers') {
          console.log('👥 Obteniendo seguidores...')
          userData = await getUserFollowers(userProfile.id)
          console.log('✅ Seguidores obtenidos:', userData.length)
        } else if (tab === 'following') {
          console.log('👤 Obteniendo seguidos...')
          userData = await getUserFollowing(userProfile.id)
          console.log('✅ Seguidos obtenidos:', userData.length)
        }
      } catch (relationshipError) {
        console.error('❌ Error obteniendo relaciones:', relationshipError)
        console.error('Error details:', {
          message: relationshipError.message,
          code: relationshipError.code,
          details: relationshipError.details
        })
        // No fallar completamente, mostrar lista vacía
        userData = []
      }
      
      setUsers(userData)
      
      // 3. REHABILITADO - verificar qué usuarios sigue el usuario actual
      if (userData.length > 0) {
        console.log('🔍 Verificando relaciones de seguimiento para usuario actual...')
        try {
          const followingChecks = await Promise.all(
            userData.map(async (user) => {
              const isFollowingUser = await isFollowing(currentUser.id, user.id)
              return { userId: user.id, isFollowing: isFollowingUser }
            })
          )
          
          const followingMap = {}
          followingChecks.forEach(({ userId, isFollowing }) => {
            followingMap[userId] = isFollowing
          })
          
          setFollowingData(followingMap)
          console.log('✅ Relaciones de seguimiento cargadas:', followingMap)
        } catch (followingError) {
          console.error('⚠️ Error verificando seguimientos (no crítico):', followingError)
          setFollowingData({})
        }
      } else {
        setFollowingData({})
      }
      
    } catch (error) {
      console.error('💥 Error crítico cargando datos:', error)
      console.error('Error stack:', error.stack)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowToggle = async (userToToggle) => {
    if (!currentUser?.id || userToToggle.id === currentUser.id) return
    
    const isCurrentlyFollowing = followingData[userToToggle.id]
    
    setFollowingStates(prev => ({ ...prev, [userToToggle.id]: true }))
    
    try {
      let result
      if (isCurrentlyFollowing) {
        result = await unfollowUser(currentUser.id, userToToggle.id)
      } else {
        result = await followUser(currentUser.id, userToToggle.id)
      }

      if (result.success) {
        setFollowingData(prev => ({
          ...prev,
          [userToToggle.id]: !isCurrentlyFollowing
        }))
        
        const message = isCurrentlyFollowing 
          ? 'Has dejado de seguir a este usuario' 
          : '¡Ahora sigues a este usuario!'
        window.showSuccessAlert?.(message)
      } else {
        console.error('Error al seguir/dejar de seguir:', result.error)
        window.showErrorAlert?.('Error al actualizar el seguimiento')
      }
    } catch (error) {
      console.error('Error en handleFollowToggle:', error)
      window.showErrorAlert?.('Error al actualizar el seguimiento')
    } finally {
      setFollowingStates(prev => ({ ...prev, [userToToggle.id]: false }))
    }
  }

  if (!isValidTab) {
    return null // El useEffect redirige
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-base-content/70">Cargando...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!targetUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
            <p className="text-base-content/70 mb-4">
              El usuario @{userHandle} no existe.
            </p>
            <Link to="/para-ti" className="btn btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const pageTitle = tab === 'followers' ? 'Seguidores' : 'Siguiendo'
  const isOwnProfile = targetUser.id === currentUser?.id

  return (
    <AppLayout
      pageTitle={pageTitle}
      showBackButton={true}
      pageSubtitle={`@${targetUser.handle}`}
    >
      {/* Header simplificado - solo tabs */}
      <div className="sticky top-0 bg-base-100 border-b border-base-300 z-10">
        {/* Tabs */}
        <div className="flex">
          <Link
            to={`/user/${userHandle}/followers`}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              tab === 'followers'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/70 hover:text-base-content'
            }`}
          >
            Seguidores
          </Link>
          <Link
            to={`/user/${userHandle}/following`}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              tab === 'following'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/70 hover:text-base-content'
            }`}
          >
            Siguiendo
          </Link>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="pb-16 md:pb-20">
        {users.length > 0 ? (
          <div>
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border-b border-base-300 hover:bg-base-200/50 transition-colors">
                <Link 
                  to={`/user/${user.handle || user.username?.toLowerCase() || 'usuario'}`}
                  className="flex items-center space-x-3 flex-1 min-w-0"
                >
                  <Avatar 
                    src={user.avatar_url}
                    alt={user.username || 'Usuario'}
                    name={user.username || 'Usuario'}
                    team={user.team}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-sm truncate">{user.username}</h3>
                      {user.team && user.team !== 'Sin Equipo' && (
                        <TeamBadge team={user.team} size="xs" />
                      )}
                    </div>
                    <p className="text-xs text-base-content/60 truncate">
                      @{user.handle || user.username?.toLowerCase() || 'usuario'}
                    </p>
                    {user.team && user.team !== 'Sin Equipo' && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-base-content/60">⚽ {user.team}</span>
                      </div>
                    )}
                    {/* Mostrar XP */}
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-green-600 font-medium">
                        {user.experience_points || 0} XP
                      </span>
                    </div>
                  </div>
                </Link>
                
                {/* Botón de seguir/dejar de seguir - CORREGIDO: mostrar siempre excepto para el usuario actual */}
                {user.id !== currentUser?.id && (
                  <button 
                    onClick={() => handleFollowToggle(user)}
                    disabled={followingStates[user.id]}
                    className={`btn btn-sm rounded-full ml-3 flex-shrink-0 min-w-[100px] ${
                      followingData[user.id]
                        ? 'btn-outline hover:btn-error hover:text-error-content group'
                        : 'btn-primary'
                    }`}
                  >
                    {followingStates[user.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : followingData[user.id] ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-1" />
                        <span className="hidden group-hover:inline">Dejar de seguir</span>
                        <span className="group-hover:hidden">Siguiendo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Seguir
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">
              {tab === 'followers' ? 'No hay seguidores' : 'No sigue a nadie'}
            </h3>
            <p className="text-base-content/60 mb-4">
              {tab === 'followers' 
                ? `${targetUser.username} aún no tiene seguidores.`
                : `${targetUser.username} aún no sigue a nadie.`
              }
            </p>
            
            {isOwnProfile && tab === 'following' && (
              <Link to="/a-quien-seguir" className="btn btn-primary">
                Buscar usuarios para seguir
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default FollowersFollowing