import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import SearchBox from '../components/SearchBox'
import { 
  getSuggestedUsers,
  followUser,
  searchUsers
} from '../services/userService'
import { 
  ArrowLeft,
  UserPlus,
  Users,
  Loader2,
  Search,
  TrendingUp
} from 'lucide-react'

const AQuienSeguir = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [activeTab, setActiveTab] = useState('suggested')
  const [loading, setLoading] = useState(true)
  const [followingStates, setFollowingStates] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)

  const tabs = [
    { id: 'suggested', label: 'Sugeridos', icon: TrendingUp },
    { id: 'search', label: 'Buscar', icon: Search }
  ]

  useEffect(() => {
    if (user?.id) {
      loadSuggestedUsers()
    }
  }, [user?.id])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim() && activeTab === 'search') {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, activeTab])

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true)
      const users = await getSuggestedUsers(user.id, 20) // Cargar más usuarios
      setSuggestedUsers(users)
    } catch (error) {
      console.error('Error cargando usuarios sugeridos:', error)
      window.showErrorAlert('Error al cargar usuarios sugeridos')
    } finally {
      setLoading(false)
    }
  }

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
        setSuggestedUsers(prev => prev.filter(u => u.id !== userToFollowId))
        setSearchResults(prev => prev.filter(u => u.id !== userToFollowId))
        window.showSuccessAlert('¡Usuario seguido exitosamente!')
        
        // Recargar usuarios sugeridos después de un tiempo
        setTimeout(() => {
          loadSuggestedUsers()
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

  const renderUserCard = (user) => (
    <div key={user.id} className="flex items-center justify-between p-4 border-b border-base-300 hover:bg-base-200/50 transition-colors">
      <Link 
        to={`/user/${user.id}`}
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
          <p className="text-xs text-base-content/60 truncate">@{user.username?.toLowerCase()}</p>
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

  return (
    <div className="min-h-screen bg-base-100 flex justify-center">
      {/* Contenedor principal centrado */}
      <div className="flex w-full max-w-7xl">
        {/* Sidebar estilo Twitter - hidden en móvil */}
        <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
          <Sidebar />
        </div>

        {/* Contenido principal - responsive */}
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
                  <h1 className="text-xl font-bold">Conecta</h1>
                  <p className="text-sm text-base-content/60">
                    Descubre usuarios increíbles
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs de navegación */}
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

          {/* Contenido según la pestaña activa */}
          <div className="pb-16 md:pb-20">
            {activeTab === 'suggested' && (
              <div>
                {/* Header de sugeridos */}
                <div className="p-4 border-b border-base-300">
                  <h2 className="text-lg font-bold mb-2">Sugeridos para ti</h2>
                  <p className="text-sm text-base-content/60">
                    Usuarios que podrían interesarte basado en tu actividad
                  </p>
                </div>

                {/* Lista de usuarios sugeridos */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="ml-2 text-base-content/70">Cargando sugerencias...</p>
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div>
                    {suggestedUsers.map(renderUserCard)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No hay más sugerencias</h3>
                    <p className="text-base-content/60 mb-4">
                      Has visto todas nuestras sugerencias por ahora.
                    </p>
                    <button 
                      onClick={loadSuggestedUsers}
                      className="btn btn-primary"
                    >
                      Actualizar sugerencias
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div>
                {/* Barra de búsqueda */}
                <div className="p-4 border-b border-base-300">
                  <h2 className="text-lg font-bold mb-3">Buscar usuarios</h2>
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

                {/* Resultados de búsqueda */}
                {searching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="ml-2 text-base-content/70">Buscando usuarios...</p>
                  </div>
                ) : searchTerm.trim() ? (
                  searchResults.length > 0 ? (
                    <div>
                      <div className="p-4 border-b border-base-300">
                        <p className="text-sm text-base-content/60">
                          {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchTerm}"
                        </p>
                      </div>
                      {searchResults.map(renderUserCard)}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                      <h3 className="text-xl font-bold mb-2">No se encontraron usuarios</h3>
                      <p className="text-base-content/60 mb-4">
                        Intenta con otro término de búsqueda.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Busca usuarios</h3>
                    <p className="text-base-content/60">
                      Escribe un nombre de usuario o equipo para encontrar personas increíbles.
                    </p>
                  </div>
                )}
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
            <Link to="/notificaciones" className="flex flex-col items-center p-2 text-base-content/60">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 17H1l5 5v-5z"/>
              </svg>
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

export default AQuienSeguir