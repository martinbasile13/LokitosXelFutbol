import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import { 
  getNotifications,
  markAsRead,
  markAllAsRead,
  formatNotificationTime,
  getNotificationText
} from '../services/notificationService'
import { 
  getRecommendedPosts
} from '../services/userService'
import { 
  ArrowLeft,
  Settings,
  Check,
  Heart,
  MessageCircle,
  UserPlus,
  Star,
  Bell,
  Loader2,
  CheckCheck
} from 'lucide-react'

const Notificaciones = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [recentData, setRecentData] = useState({
    followers: [],
    likes: [],
    comments: [],
    recommendedPosts: []
  })
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)

  const getIconComponent = (type) => {
    switch (type) {
      case 'follow':
        return UserPlus
      case 'like':
        return Heart
      case 'comment':
        return MessageCircle
      case 'recommended_post':
        return Star
      default:
        return Bell
    }
  }

  const tabs = [
    { id: 'all', label: 'Todas', icon: Bell },
    { id: 'verified', label: 'Verificadas', icon: CheckCheck },
    { id: 'mentions', label: 'Menciones', icon: MessageCircle }
  ]

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
      loadRecentData()
    }
  }, [user?.id, activeTab])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications(user.id, activeTab, 20)
      setNotifications(data)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      window.showErrorAlert('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const loadRecentData = async () => {
    try {
      // Cargar solo posts recomendados ya que las otras funciones no existen
      const recommendedPosts = await getRecommendedPosts(user.id, 3)

      setRecentData({
        followers: [], // Dejar vacío por ahora
        likes: [], // Dejar vacío por ahora
        comments: [], // Dejar vacío por ahora
        recommendedPosts
      })
    } catch (error) {
      console.error('Error cargando datos recientes:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markAsRead(notificationId)
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marcando como leída:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true)
      const result = await markAllAsRead(user.id)
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        window.showSuccessAlert('Todas las notificaciones marcadas como leídas')
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
      window.showErrorAlert('Error al marcar como leídas')
    } finally {
      setMarkingAsRead(false)
    }
  }

  const handleNotificationClick = (notification) => {
    // Marcar como leída al hacer click
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Navegar según el tipo de notificación
    if (notification.target_id) {
      if (notification.type === 'like' || notification.type === 'comment') {
        navigate(`/post/${notification.target_id}`)
      }
    } else if (notification.type === 'follow' && notification.actor?.id) {
      navigate(`/user/${notification.actor.id}`)
    }
  }

  const renderNotificationItem = (notification) => {
    const isUnread = !notification.read
    const IconComponent = getIconComponent(notification.type)
    const text = getNotificationText(notification)
    const time = formatNotificationTime(notification.created_at)

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`flex items-start space-x-3 p-4 border-b border-base-300 hover:bg-base-200/50 transition-colors cursor-pointer ${
          isUnread ? 'bg-primary/5 border-l-4 border-l-primary' : ''
        }`}
      >
        {/* Icono del tipo de notificación */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          notification.type === 'follow' ? 'bg-blue-100 text-blue-600' :
          notification.type === 'like' ? 'bg-red-100 text-red-600' :
          notification.type === 'comment' ? 'bg-green-100 text-green-600' :
          'bg-yellow-100 text-yellow-600'
        }`}>
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Avatar del usuario que realizó la acción */}
        {notification.actor && (
          <Avatar 
            src={notification.actor.avatar_url}
            alt={notification.actor.username}
            name={notification.actor.username}
            team={notification.actor.team}
            size="sm"
            className="flex-shrink-0"
          />
        )}

        {/* Contenido de la notificación */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-normal'}`}>
                {text}
              </p>
              
              {/* Preview del contenido si es disponible */}
              {notification.data?.comment_preview && (
                <p className="text-xs text-base-content/60 mt-1 truncate">
                  "{notification.data.comment_preview}..."
                </p>
              )}

              {/* Equipo del actor */}
              {notification.actor?.team && (
                <div className="flex items-center space-x-1 mt-1">
                  <TeamBadge team={notification.actor.team} size="xs" />
                  <span className="text-xs text-base-content/60">
                    {notification.actor.team}
                  </span>
                </div>
              )}
            </div>

            {/* Tiempo y estado */}
            <div className="flex items-center space-x-2 ml-2">
              <span className="text-xs text-base-content/60">{time}</span>
              {isUnread && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>
          </div>
        </div>

        {/* Botón para marcar como leída */}
        {isUnread && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMarkAsRead(notification.id)
            }}
            className="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100"
          >
            <Check className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  const renderRecommendedPost = (post) => (
    <Link
      key={post.id}
      to={`/post/${post.id}`}
      className="block p-3 border border-base-300 rounded-lg hover:bg-base-200/50 transition-colors"
    >
      <div className="flex items-start space-x-3">
        <Avatar 
          src={post.user?.avatar_url}
          alt={post.user?.username}
          name={post.user?.username || 'Usuario'}
          team={post.user?.team}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm">{post.user?.username}</span>
            {post.user?.team && (
              <TeamBadge team={post.user.team} size="xs" />
            )}
            <span className="text-xs text-base-content/60">
              {formatNotificationTime(post.created_at)}
            </span>
          </div>
          <p className="text-sm line-clamp-2">{post.content}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-base-content/60">
            <span className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{post.likes_count || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>{post.views_count || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-base-100 flex justify-center">
      {/* Contenedor principal centrado */}
      <div className="flex w-full max-w-7xl">
        {/* Sidebar estilo Twitter - hidden en móvil */}
        <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
          <Sidebar />
        </div>

        {/* Contenido principal de notificaciones - responsive */}
        <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0">
          {/* Header con navegación */}
          <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">Notificaciones</h1>
                  <p className="text-sm text-base-content/60">
                    {notifications.filter(n => !n.read).length} sin leer
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAsRead || notifications.every(n => n.read)}
                  className="btn btn-ghost btn-sm"
                >
                  {markingAsRead ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline ml-2">Marcar todas como leídas</span>
                </button>
                <button className="btn btn-ghost btn-circle btn-sm">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs de filtros */}
            <div className="flex border-b border-base-300">
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-base-content/60 hover:text-base-content'
                    }`}
                  >
                    <TabIcon className="w-4 h-4 mr-2 inline" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contenido de notificaciones */}
          <div className="pb-16 md:pb-20">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-2 text-base-content/70">Cargando notificaciones...</p>
              </div>
            ) : (
              <>
                {/* Posts recomendados */}
                {recentData.recommendedPosts.length > 0 && (
                  <div className="p-4 border-b border-base-300">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      Posts recomendados
                    </h3>
                    <div className="space-y-3">
                      {recentData.recommendedPosts.map(renderRecommendedPost)}
                    </div>
                  </div>
                )}

                {/* Lista de notificaciones */}
                {notifications.length > 0 ? (
                  <div>
                    {notifications.map(renderNotificationItem)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No hay notificaciones</h3>
                    <p className="text-base-content/60 mb-4">
                      Cuando tengas nuevas notificaciones, aparecerán aquí.
                    </p>
                    <Link to="/para-ti" className="btn btn-primary">
                      Ir al feed
                    </Link>
                  </div>
                )}

                {/* Actividad reciente si no hay notificaciones pero hay datos */}
                {notifications.length === 0 && (recentData.followers.length > 0 || recentData.likes.length > 0) && (
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-4">Actividad reciente</h3>
                    
                    {/* Nuevos seguidores */}
                    {recentData.followers.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Nuevos seguidores
                        </h4>
                        <div className="space-y-2">
                          {recentData.followers.map((follow) => (
                            <Link
                              key={follow.id}
                              to={`/user/${follow.follower?.id}`}
                              className="flex items-center space-x-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                            >
                              <Avatar 
                                src={follow.follower?.avatar_url}
                                alt={follow.follower?.username}
                                name={follow.follower?.username || 'Usuario'}
                                team={follow.follower?.team}
                                size="sm"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-sm">
                                  {follow.follower?.username}
                                </p>
                                <p className="text-xs text-base-content/60">
                                  {formatNotificationTime(follow.created_at)}
                                </p>
                              </div>
                              {follow.follower?.team && (
                                <TeamBadge team={follow.follower.team} size="xs" />
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
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
            <Link to="/para-ti" className="flex flex-col items-center p-2 text-base-content/60">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              <span className="text-xs mt-1">Inicio</span>
            </Link>
            <Link to="/explorar" className="flex flex-col items-center p-2 text-base-content/60">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span className="text-xs mt-1">Buscar</span>
            </Link>
            <Link to="/notificaciones" className="flex flex-col items-center p-2 text-primary">
              <Bell className="w-6 h-6" />
              <span className="text-xs mt-1">Notif</span>
            </Link>
            <Link to="/perfil" className="flex flex-col items-center p-2 text-base-content/60">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span className="text-xs mt-1">Perfil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notificaciones
