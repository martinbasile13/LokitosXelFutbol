import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Avatar from '../components/UI/Avatar'
import TeamBadge from '../components/UI/TeamBadge'
import SearchBox from '../components/UI/SearchBox'
import { PageSection, ContentList } from '../components/shared/PageComponents'
import { usePageState } from '../components/shared/hooks/usePageState'
import { 
  getSuggestedUsers,
  followUser,
  searchUsers
} from '../services/userService'
import { 
  TrendingUp,
  Search,
  UserPlus,
  Loader2
} from 'lucide-react'

const AQuienSeguir = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [followingStates, setFollowingStates] = useState({})

  // Configuración de tabs
  const tabs = [
    { id: 'suggested', label: 'Sugeridos', icon: TrendingUp },
    { id: 'search', label: 'Buscar', icon: Search }
  ]

  // Estado de la página usando nuestro hook
  const pageState = usePageState({
    initialTab: 'suggested',
    tabs,
    initialLoading: true,
    emptyConfig: {
      icon: '👥',
      title: 'No hay más sugerencias',
      message: 'Has visto todas nuestras sugerencias por ahora.',
      action: <button className="btn btn-primary" onClick={() => pageState.refreshData(loadSuggestedUsers)}>
        Actualizar sugerencias
      </button>
    }
  })

  // Cargar usuarios sugeridos
  const loadSuggestedUsers = async () => {
    try {
      const users = await getSuggestedUsers(user.id, 20)
      return users
    } catch (error) {
      console.error('Error cargando usuarios sugeridos:', error)
      window.showErrorAlert('Error al cargar usuarios sugeridos')
      return []
    }
  }

  // Efecto inicial
  useEffect(() => {
    if (user?.id) {
      pageState.refreshData(loadSuggestedUsers)
    }
  }, [user?.id])

  // Búsqueda con debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim() && pageState.activeTab === 'search') {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, pageState.activeTab])

  const handleSearch = async (term) => {
    if (!term.trim() || !user?.id) return

    try {
      setSearching(true)
      const results = await searchUsers(term, user.id)
      setSearchResults(results)
    } catch (error) {
      console.error('Error buscando usuarios:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleFollowUser = async (userToFollowId) => {
    try {
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: true }))
      
      const result = await followUser(user.id, userToFollowId)
      
      if (result.success) {
        // Remover usuario de ambas listas después de seguirlo
        pageState.setData(prev => prev.filter(u => u.id !== userToFollowId))
        setSearchResults(prev => prev.filter(u => u.id !== userToFollowId))
        window.showSuccessAlert('¡Usuario seguido exitosamente!')
        
        // Recargar usuarios sugeridos después de un tiempo
        setTimeout(() => {
          if (pageState.activeTab === 'suggested') {
            pageState.refreshData(loadSuggestedUsers)
          }
        }, 1000)
      } else {
        console.error('Error en followUser:', result.error)
        setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
        window.showErrorAlert('Error al seguir usuario')
      }
    } catch (error) {
      console.error('Error siguiendo usuario:', error)
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
      window.showErrorAlert('Error al seguir usuario')
    }
  }

  // Renderizar tarjeta de usuario
  const renderUserCard = (user) => (
    <div className="flex items-center justify-between p-4 border-b border-base-300 hover:bg-base-200/50 transition-colors">
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
          <p className="text-xs text-base-content/60 truncate">@{user.handle || user.username?.toLowerCase() || 'usuario'}</p>
          {user.team && user.team !== 'Sin Equipo' && (
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs text-base-content/60">⚽ {user.team}</span>
            </div>
          )}
        </div>
      </Link>
      
      <button 
        onClick={() => handleFollowUser(user.id)}
        disabled={followingStates[user.id]}
        className="btn btn-sm rounded-full bg-white text-black hover:bg-gray-200 border-gray-300 ml-3 flex-shrink-0 min-w-[80px]"
      >
        {followingStates[user.id] ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Seguir'
        )}
      </button>
    </div>
  )

  // Contenido de la pestaña de búsqueda
  const renderSearchContent = () => {
    if (searching) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="ml-2 text-base-content/70">Buscando usuarios...</p>
        </div>
      )
    }

    if (!searchTerm.trim()) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">Busca usuarios</h3>
          <p className="text-base-content/60">
            Escribe un nombre de usuario o equipo para encontrar personas increíbles.
          </p>
        </div>
      )
    }

    if (searchResults.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-xl font-bold mb-2">No se encontraron usuarios</h3>
          <p className="text-base-content/60 mb-4">
            Intenta con otro término de búsqueda.
          </p>
        </div>
      )
    }

    return (
      <div>
        <div className="p-4 border-b border-base-300">
          <p className="text-sm text-base-content/60">
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchTerm}"
          </p>
        </div>
        {searchResults.map(renderUserCard)}
      </div>
    )
  }

  return (
    <AppLayout
      pageTitle="Conecta"
      pageSubtitle="Descubre usuarios increíbles"
      showBackButton={true}
      tabs={tabs}
      activeTab={pageState.activeTab}
      onTabChange={pageState.handleTabChange}
    >
      {/* Contenido según la pestaña activa */}
      {pageState.activeTab === 'suggested' && (
        <PageSection
          title="Sugeridos para ti"
          subtitle="Usuarios que podrían interesarte basado en tu actividad"
        >
          <ContentList
            items={pageState.data}
            renderItem={renderUserCard}
            loading={pageState.loading}
            empty={pageState.empty}
            emptyConfig={{
              icon: <UserPlus className="w-16 h-16 mx-auto text-base-content/30 mb-4" />,
              title: pageState.emptyTitle,
              message: pageState.emptyMessage,
              action: pageState.emptyAction
            }}
          />
        </PageSection>
      )}

      {pageState.activeTab === 'search' && (
        <PageSection
          title="Buscar usuarios"
        >
          <div className="p-4 border-b border-base-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Buscar por nombre de usuario o equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-base-200 rounded-full py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-base-100 transition-all duration-200"
              />
            </div>
          </div>
          {renderSearchContent()}
        </PageSection>
      )}
    </AppLayout>
  )
}

export default AQuienSeguir