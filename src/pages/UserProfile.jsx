import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PostCard from '../components/PostCard/index.jsx'
import Avatar from '../components/UI/Avatar'
import TeamBadge from '../components/UI/TeamBadge'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/Navigation/PageHeader'
import { 
  getUserProfile,
  getUserStats, 
  getUserPosts,
  followUser,
  unfollowUser,
  isFollowing
} from '../services/userService'
import { deletePost } from '../services/posts'
import { 
  MapPin, 
  Calendar,
  MoreHorizontal,
  Loader2,
  UserPlus,
  UserMinus,
  Flag
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

  const handleDeletePost = async (postId) => {
    if (!currentUser?.id) {
      window.showErrorAlert('Debes estar autenticado para eliminar posts')
      return
    }

    try {
      const result = await deletePost(postId, currentUser.id)
      
      if (result.success) {
        // Remover el post del estado local
        setPosts(prev => prev.filter(post => post.id !== postId))
        // Actualizar las estadísticas
        setUserStats(prev => ({ ...prev, posts: prev.posts - 1 }))
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-base-content/70">Cargando perfil...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!userProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
            <p className="text-base-content/70 mb-4">El usuario que buscas no existe.</p>
            <Link to="/para-ti" className="btn btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader 
        title={userProfile?.username || 'Usuario'}
        showBackButton={true}
      />

      {/* Header con imagen de fondo */}
      <div className="relative">
        {/* Imagen de fondo del header - "portada" */}
        <div className="h-52 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
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

        {/* Avatar circular superpuesto - CENTRADO Y MÁS GRANDE */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="w-29 h-29 border-4 border-base-100 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile?.username || 'Usuario'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {(userProfile?.username || 'Usuario').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* XP debajo del avatar - diseño compacto y centrado */}
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white inline-flex items-center justify-center min-w-0">
              <span className="whitespace-nowrap">{userProfile?.experience_points || 0}</span>
              <span className="ml-1 whitespace-nowrap">XP</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {/* Dropdown más opciones */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm bg-base-100/80 backdrop-blur-sm border border-base-300">
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
            className={`btn btn-sm rounded-full px-4 ${
              isFollowingUser 
                ? 'btn-outline hover:btn-error hover:text-error-content bg-base-100/80 backdrop-blur-sm' 
                : 'btn-primary'
            }`}
          >
            {isFollowLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollowingUser ? (
              <>
                <UserMinus className="w-3 h-3 mr-1" />
                <span className="hidden group-hover:inline">Dejar de seguir</span>
                <span className="group-hover:hidden">Siguiendo</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1" />
                Seguir
              </>
            )}
          </button>
        </div>
      </div>

      {/* Información del perfil - Layout compacto con flex */}
      <div className="px-4 pt-14 pb-4">
        {/* Contenedor principal con flex */}
        <div className="flex justify-between items-start">
          {/* Lado izquierdo: Info del usuario */}
          <div className="flex-1 min-w-0">
            {/* Nombre del usuario - MÁS GRANDE */}
            <h2 className="text-2xl font-bold text-base-content mb-1">
              {userProfile?.username || 'Usuario'}
            </h2>
            <p className="text-base text-base-content/70 mb-1">
              @{userProfile?.username || 'usuario'}
            </p>
            
            {/* Escudo del equipo - MÁS GRANDE */}
            {userProfile?.team && userProfile.team !== 'Sin Equipo' && (
              <div className="flex items-center space-x-2 mb-2">
                <TeamBadge team={userProfile.team} size="lg" />
                <span className="text-lg font-medium text-primary">
                  {userProfile.team}
                </span>
              </div>
            )}
          </div>

          {/* Lado derecho: Estadísticas de seguimiento */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            {/* Seguidores y Siguiendo */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{userStats.followers}</div>
                <div className="text-base-content/70">Seguidores</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{userStats.following}</div>
                <div className="text-base-content/70">Siguiendo</div>
              </div>
            </div>
            
            {/* Website si existe - Debajo de las estadísticas */}
            {userProfile?.website && (
              <a 
                href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center space-x-1 max-w-40"
              >
                <span>🔗</span>
                <span className="truncate">{userProfile.website}</span>
              </a>
            )}
          </div>
        </div>

        {/* Bio/Descripción - Caja separada - Solo mostrar si existe */}
        {userProfile?.bio && (
          <div className="mt-4 p-3 bg-base-200 rounded-lg border">
            <p className="text-base-content/90 text-sm leading-relaxed">{userProfile.bio}</p>
          </div>
        )}

        {/* Ubicación y fecha de unión - Compacto */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-base-content/70">
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
      </div>

      {/* Pestaña única - Solo Posts centrado con contador */}
      <div className="border-b border-base-300">
        <div className="flex justify-center">
          <div className="px-6 py-4 text-sm font-medium border-b-2 border-primary text-primary">
            Posts ({userStats.posts})
          </div>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="pb-16 md:pb-20">
        {activeTab === 'posts' && (
          <div>
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
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
    </AppLayout>
  )
}

export default UserProfile