import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getUserStats, getUserPosts, getUserProfile, followUser, unfollowUser, isFollowing } from '../services/userService'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar,
  MoreHorizontal,
  Loader2,
  UserPlus,
  UserMinus,
  Flag,
  Link as LinkIcon
} from 'lucide-react'

const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [userStats, setUserStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  useEffect(() => {
    if (userId && currentUser?.id) {
      // Si intenta ver su propio perfil, redirigir a /perfil
      if (userId === currentUser.id) {
        navigate('/perfil', { replace: true })
        return
      }
      
      loadUserData()
    }
  }, [userId, currentUser, navigate])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos del usuario en paralelo
      const [profileResult, statsResult, postsResult, followingResult] = await Promise.all([
        getUserProfile(userId),
        getUserStats(userId),
        getUserPosts(userId),
        isFollowing(currentUser.id, userId)
      ])

      setUserProfile(profileResult)
      setUserStats(statsResult)
      setPosts(postsResult)
      setIsFollowingUser(followingResult)
      
    } catch (error) {
      console.error('Error cargando datos del usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUser?.id || !userId) return
    
    setIsFollowLoading(true)
    try {
      let result
      if (isFollowingUser) {
        result = await unfollowUser(currentUser.id, userId)
      } else {
        result = await followUser(currentUser.id, userId)
      }

      if (result.success) {
        setIsFollowingUser(!isFollowingUser)
        // Actualizar contador de seguidores
        setUserStats(prev => ({
          ...prev,
          followers: isFollowingUser ? prev.followers - 1 : prev.followers + 1
        }))
      } else {
        console.error('Error al seguir/dejar de seguir:', result.error)
        alert('Error al actualizar el seguimiento')
      }
    } catch (error) {
      console.error('Error en handleFollowToggle:', error)
      alert('Error al actualizar el seguimiento')
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleReport = () => {
    alert('Función de reportar usuario en desarrollo. ¡Gracias por tu feedback!')
  }

  const tabs = [
    { id: 'posts', label: 'Posts', count: userStats.posts },
    { id: 'replies', label: 'Replies' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'articles', label: 'Articles' },
    { id: 'media', label: 'Media' },
    { id: 'likes', label: 'Likes' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-base-content/70">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
          <p className="text-base-content/70 mb-4">El usuario que buscas no existe.</p>
          <Link to="/para-ti" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-base-100 flex justify-center">
        {/* Contenedor principal centrado */}
        <div className="flex w-full max-w-7xl">
          {/* Sidebar estilo Twitter - hidden en móvil */}
          <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
            <Sidebar />
          </div>

          {/* Contenido principal del perfil - responsive */}
          <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0">
            {/* Header con navegación */}
            <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300">
              <div className="flex items-center space-x-4 p-4">
                <button 
                  onClick={() => window.history.back()}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">{userProfile?.username || 'Usuario'}</h1>
                  <p className="text-sm text-base-content/60">{userStats.posts} posts</p>
                </div>
              </div>
            </div>

            {/* Header con imagen de fondo */}
            <div className="relative">
              {/* Imagen de fondo del header */}
              <div className="h-32 md:h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
                {/* Mostrar imagen de portada si existe */}
                {userProfile?.cover_image_url ? (
                  <img 
                    src={userProfile.cover_image_url} 
                    alt="Imagen de portada" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error cargando imagen de portada:', userProfile.cover_image_url);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40"></div>
                )}
              </div>

              {/* Avatar posicionado sobre el header */}
              <div className="absolute -bottom-12 left-4">
                <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-base-100 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile?.username || 'Usuario'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl md:text-4xl font-bold text-white">
                      {(userProfile?.username || 'Usuario').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Información del perfil */}
            <div className="px-4 pt-16 pb-4">
              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 mb-4">
                {/* Dropdown más opciones */}
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                  <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow border border-base-300">
                    <li>
                      <button 
                        onClick={handleReport}
                        className="flex items-center gap-2 text-warning"
                      >
                        <Flag className="w-4 h-4" />
                        Reportar usuario
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Botón seguir/siguiendo */}
                <button 
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`btn btn-sm rounded-full px-6 ${
                    isFollowingUser 
                      ? 'btn-outline hover:btn-error hover:text-error-content' 
                      : 'btn-primary'
                  }`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowingUser ? (
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
              </div>

              {/* Nombre y verificación */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-2xl font-bold">{userProfile?.username || 'Usuario'}</h2>
                  {/* Badge de verificación */}
                  <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-full">
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-xs text-primary font-medium">Verificado</span>
                  </div>
                </div>
                <p className="text-base-content/60">@{userProfile?.username?.toLowerCase() || 'usuario'}</p>
              </div>

              {/* Bio del usuario - Solo mostrar si existe */}
              {userProfile?.bio && (
                <div className="mt-4">
                  <p className="text-base-content/80 leading-relaxed">{userProfile.bio}</p>
                </div>
              )}

              {/* Ubicación y fecha */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-base-content/60">
                {userProfile?.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{userProfile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Se unió en {userProfile?.created_at 
                      ? new Date(userProfile.created_at).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long' 
                        })
                      : 'fecha desconocida'
                    }
                  </span>
                </div>
              </div>

              {/* Sitio web */}
              {userProfile?.website && (
                <div className="mb-4">
                  <a 
                    href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center space-x-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>{userProfile.website}</span>
                  </a>
                </div>
              )}

              {/* Equipo favorito */}
              {userProfile?.team && userProfile.team !== 'Sin Equipo' && (
                <div className="flex items-center space-x-2 mb-4">
                  <TeamBadge team={userProfile.team} size="sm" />
                  <span className="text-sm text-primary font-medium">
                    {userProfile.team}
                  </span>
                </div>
              )}

              {/* Estadísticas de seguidores */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-base-content">{userStats.following}</span>
                  <span className="text-base-content/60">Siguiendo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-base-content">{userStats.followers}</span>
                  <span className="text-base-content/60">Seguidores</span>
                </div>
              </div>
            </div>

            {/* Pestañas de navegación */}
            <div className="border-b border-base-300">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-base-content/60 hover:text-base-content'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido de las pestañas */}
            <div className="pb-16 md:pb-20">
              {activeTab === 'posts' && (
                <div>
                  {posts.length > 0 ? (
                    <div>
                      {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-bold mb-2">No hay posts aún</h3>
                      <p className="text-base-content/60 mb-4">
                        {userProfile?.username} aún no ha publicado nada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab !== 'posts' && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-bold mb-2">Próximamente</h3>
                  <p className="text-base-content/60">
                    Esta sección estará disponible pronto.
                  </p>
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
              <Link to="/para-ti" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Inicio</span>
              </Link>
              <Link to="/explorar" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span className="text-xs mt-1">Buscar</span>
              </Link>
              <Link to="/notificaciones" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 17H1l5 5v-5z"/>
                </svg>
                <span className="text-xs mt-1">Notif</span>
              </Link>
              <Link to="/perfil" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Perfil</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserProfile