import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/UI/Avatar'
import TeamBadge from '../components/UI/TeamBadge'
import AppLayout from '../components/AppLayout'
import { ActionButton, ContentList } from '../components/shared/PageComponents'
import { usePageState } from '../components/shared/hooks/usePageState'
import { 
  getNotifications,
  markAsRead,
  markAllAsRead,
  formatNotificationTime,
  getNotificationText
} from '../services/notificationService'
import { getRecommendedPosts } from '../services/userService'
import { 
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
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const [recentData, setRecentData] = useState({
    followers: [],
    likes: [],
    comments: [],
    recommendedPosts: []
  })

  // Configuración de tabs
  const tabs = [
    { id: 'all', label: 'Todas', icon: Bell },
    { id: 'mention', label: 'Menciones', icon: MessageCircle } // ✅ Cambiar de 'mentions' a 'mention'
  ]

  // Estado de la página usando nuestro hook
  const pageState = usePageState({
    initialTab: 'all',
    tabs,
    initialLoading: true,
    emptyConfig: {
      icon: <Bell className="w-16 h-16 mx-auto text-base-content/30 mb-4" />,
      title: 'No hay notificaciones',
      message: 'Cuando tengas nuevas notificaciones, aparecerán aquí.',
      action: <Link to="/para-ti" className="btn btn-primary">Ir al feed</Link>
    }
  })

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      const data = await getNotifications(user.id, pageState.activeTab, 20)
      return data || []
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      window.showErrorAlert?.('Error al cargar notificaciones')
      return []
    }
  }

  // Cargar datos recientes
  const loadRecentData = async () => {
    try {
      const recommendedPosts = await getRecommendedPosts(user.id, 3)
      setRecentData({
        followers: [], // TEMPORALMENTE VACÍO PARA EVITAR 406
        likes: [], // TEMPORALMENTE VACÍO PARA EVITAR 406
        comments: [], // TEMPORALMENTE VACÍO PARA EVITAR 406
        recommendedPosts: recommendedPosts || []
      })
      console.log('⚠️ Notificaciones: Datos de followers temporalmente deshabilitados para evitar errores 406')
    } catch (error) {
      console.error('Error cargando datos recientes:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      pageState.refreshData(loadNotifications)
      loadRecentData()
    }
  }, [user?.id, pageState.activeTab])

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markAsRead(notificationId)
      if (result.success) {
        pageState.setData(prev => 
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
        pageState.setData(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        window.showSuccessAlert?.('Todas las notificaciones marcadas como leídas')
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
      window.showErrorAlert?.('Error al marcar como leídas')
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
    if (notification.type === 'mention' || notification.type === 'like' || notification.type === 'comment') {
      // Para menciones, usar el post_id del campo data
      const postId = notification.data?.post_id || notification.target_id
      if (postId) {
        navigate(`/post/${postId}`)
      }
    } else if (notification.type === 'follow' && notification.actor?.id) {
      // Para seguimientos, navegar al perfil del actor
      navigate(`/user/${notification.actor.id}`)
    }
  }

  const getIconComponent = (type) => {
    switch (type) {
      case 'follow': return UserPlus
      case 'like': return Heart
      case 'comment': return MessageCircle
      case 'mention': return MessageCircle // Agregar soporte para menciones
      case 'recommended_post': return Star
      default: return Bell
    }
  }

  // Renderizar item de notificación
  const renderNotificationItem = (notification) => {
    const isUnread = !notification.read
    const IconComponent = getIconComponent(notification.type)
    const text = getNotificationText(notification)
    const time = formatNotificationTime(notification.created_at)

    return (
      <div
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
          notification.type === 'mention' ? 'bg-purple-100 text-purple-600' :
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

  // Renderizar post recomendado
  const renderRecommendedPost = (post) => (
    <Link
      to={`/post/${post.id}`}
      className="block p-3 border border-base-300 rounded-lg hover:bg-base-200/50 transition-colors"
    >
      <div className="flex items-start space-x-3">
        <Avatar 
          src={post.profiles?.avatar_url}
          alt={post.profiles?.username}
          name={post.profiles?.username || 'Usuario'}
          team={post.profiles?.team}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm">{post.profiles?.username || 'Usuario'}</span>
            {post.profiles?.team && (
              <TeamBadge team={post.profiles.team} size="xs" />
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

  // Acciones del header
  const headerActions = [
    <ActionButton
      key="mark-all"
      icon={CheckCheck}
      label="Marcar todas como leídas"
      onClick={handleMarkAllAsRead}
      loading={markingAsRead}
      disabled={markingAsRead || pageState.data.every(n => n.read)}
      variant="ghost"
    />,
    <ActionButton
      key="settings"
      icon={Settings}
      onClick={() => {}}
      variant="ghost"
      className="btn-circle"
    />
  ]

  return (
    <AppLayout
      pageTitle="Notificaciones"
      pageSubtitle={`${pageState.data.filter(n => !n.read).length} sin leer`}
      showBackButton={true}
      headerActions={headerActions}
      tabs={tabs}
      activeTab={pageState.activeTab}
      onTabChange={pageState.handleTabChange}
      loading={pageState.loading}
      loadingText="Cargando notificaciones..."
      empty={pageState.empty}
      emptyIcon={pageState.emptyIcon}
      emptyTitle={pageState.emptyTitle}
      emptyMessage={pageState.emptyMessage}
      emptyAction={pageState.emptyAction}
    >
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
      {!pageState.loading && !pageState.empty && (
        <ContentList
          items={pageState.data}
          renderItem={renderNotificationItem}
          className=""
        />
      )}

      {/* Actividad reciente si no hay notificaciones pero hay datos */}
      {pageState.data.length === 0 && (recentData.followers.length > 0 || recentData.likes.length > 0) && (
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
    </AppLayout>
  )
}

export default Notificaciones
