import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import PostCard from '../components/PostCard/index.jsx'
import AppLayout from '../components/AppLayout'
import PostComposer from '../components/PostComposer'
import Avatar from '../components/UI/Avatar'
import SearchBox from '../components/UI/SearchBox'
import { 
  Clock,
  TrendingUp,
  UserPlus,
  Loader2,
  ExternalLink,
  Eye,
  MessageCircle,
  Heart,
  Share,
  X
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { getSuggestedUsers, followUser } from '../services/userService'

const Explorar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [followingStates, setFollowingStates] = useState({})
  const [showPostModal, setShowPostModal] = useState(false)

  // Datos de ejemplo para noticias
  const newsItems = [
    {
      id: 1,
      title: "Boca vs River: Se define el Superclásico del siglo",
      summary: "El partido más esperado del año se jugará el próximo domingo en La Bombonera con entradas agotadas.",
      time: "2 horas",
      source: "TyC Sports",
      image: "/public/primeradivision/boca.png",
      views: "12.5K",
      comments: 234,
      likes: 1840
    },
    {
      id: 2,
      title: "Racing campeón: Los hinchas celebran en las calles",
      summary: "La Academia logró el título tras 23 años y miles de fanáticos salieron a festejar por toda la ciudad.",
      time: "4 horas",
      source: "ESPN",
      image: "/public/primeradivision/racing.png",
      views: "8.3K",
      comments: 189,
      likes: 1203
    },
    {
      id: 3,
      title: "Nuevo refuerzo para Independiente en el mercado de pases",
      summary: "El Rojo cerró la incorporación del delantero brasileño que llegará para la próxima temporada.",
      time: "6 horas",
      source: "Olé",
      image: "/public/primeradivision/independiente.png",
      views: "5.7K",
      comments: 95,
      likes: 678
    }
  ]

  // Datos de ejemplo para tendencias (después será dinámico)
  const trends = [
    { 
      id: 1,
      topic: '#BocaRiver', 
      posts: '45.2K posts',
      category: 'Tendencia en Argentina',
      growth: '+15%'
    },
    { 
      id: 2,
      topic: '#Racing', 
      posts: '38.7K posts',
      category: 'Deportes',
      growth: '+8%'
    },
    { 
      id: 3,
      topic: '#PrimeraDivisión', 
      posts: '25.1K posts',
      category: 'Fútbol argentino',
      growth: '+12%'
    },
    { 
      id: 4,
      topic: '#LigaProfesional', 
      posts: '18.9K posts',
      category: 'Tendencia en Argentina',
      growth: '+5%'
    },
    { 
      id: 5,
      topic: '#Estudiantes', 
      posts: '12.4K posts',
      category: 'Deportes',
      growth: '+20%'
    }
  ]

  useEffect(() => {
    if (user?.id) {
      loadSuggestedUsers()
    }
  }, [user])

  const loadSuggestedUsers = async () => {
    try {
      setLoadingUsers(true)
      const users = await getSuggestedUsers(user.id, 5) // Cargar más usuarios para la página de explorar
      setSuggestedUsers(users)
    } catch (error) {
      console.error('Error cargando usuarios sugeridos:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleFollowUser = async (userToFollowId) => {
    try {
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: true }))
      
      const result = await followUser(user.id, userToFollowId)
      
      if (result.success) {
        setSuggestedUsers(prev => prev.filter(u => u.id !== userToFollowId))
        setTimeout(() => {
          loadSuggestedUsers()
        }, 1000)
      } else {
        console.error('Error en followUser:', result.error)
        setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
        window.showErrorAlert('Error al seguir usuario: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error siguiendo usuario:', error)
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
      window.showErrorAlert('Error al seguir usuario: ' + error.message)
    }
  }

  const handlePostCreated = async (newPost) => {
    setShowPostModal(false)
    window.showSuccessAlert('¡Post creado exitosamente!')
  }

  return (
    <AppLayout showRightPanel={false}>
      {/* Header con búsqueda */}
      <div className="sticky top-0 bg-base-100/80 backdrop-blur border-b border-base-300 z-10 p-4">
        <h1 className="text-2xl font-bold mb-4">Explorar</h1>
        <SearchBox />
      </div>

      {/* Contenido principal en contenedor con scroll */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Sección de Noticias */}
        <section className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
          <div className="p-4 border-b border-base-300">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Clock className="w-6 h-6 text-primary" />
              <span>Noticias del día</span>
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Las últimas noticias del fútbol argentino</p>
          </div>
          
          <div className="space-y-0">
            {newsItems.map((news, index) => (
              <article 
                key={news.id} 
                className={`p-4 hover:bg-base-200/70 transition-colors cursor-pointer ${
                  index < newsItems.length - 1 ? 'border-b border-base-300' : ''
                }`}
              >
                <div className="flex space-x-3">
                  <div className="w-16 h-16 bg-base-300 rounded-lg overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <span className="text-2xl">⚽</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-base leading-tight mb-1">{news.title}</h3>
                        <p className="text-sm text-base-content/70 mb-2 line-clamp-2">{news.summary}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-base-content/60">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Hace {news.time}</span>
                          </span>
                          <span>• {news.source}</span>
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{news.views}</span>
                          </span>
                        </div>
                      </div>
                      
                      <ExternalLink className="w-4 h-4 text-base-content/40 ml-2 flex-shrink-0" />
                    </div>
                    
                    {/* Stats de la noticia */}
                    <div className="flex items-center space-x-4 mt-3 text-xs text-base-content/50">
                      <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                        <MessageCircle className="w-3 h-3" />
                        <span>{news.comments}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-error transition-colors">
                        <Heart className="w-3 h-3" />
                        <span>{news.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-info transition-colors">
                        <Share className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Sección de Tendencias */}
        <section className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
          <div className="p-4 border-b border-base-300">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span>Tendencias para ti</span>
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Los temas más populares en fútbol argentino</p>
          </div>
          
          <div className="space-y-0">
            {trends.map((trend, index) => (
              <div 
                key={trend.id} 
                className={`p-4 hover:bg-base-200/70 transition-colors cursor-pointer ${
                  index < trends.length - 1 ? 'border-b border-base-300' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs text-base-content/60">{trend.category}</p>
                    <p className="font-bold text-primary text-lg">{trend.topic}</p>
                    <p className="text-xs text-base-content/60">{trend.posts}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1 text-xs">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-success font-medium">{trend.growth}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="p-4">
              <button className="text-primary hover:underline text-sm font-medium">
                Ver más tendencias
              </button>
            </div>
          </div>
        </section>

        {/* Sección A quién seguir */}
        <section className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
          <div className="p-4 border-b border-base-300">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <UserPlus className="w-6 h-6 text-primary" />
              <span>A quién seguir</span>
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Conecta con otros fanáticos del fútbol</p>
          </div>
          
          <div className="space-y-0">
            {loadingUsers ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-base-content/60">Cargando usuarios...</p>
              </div>
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map((suggestedUser, index) => (
                <div 
                  key={suggestedUser.id} 
                  className={`p-4 hover:bg-base-200/70 transition-colors ${
                    index < suggestedUsers.length - 1 ? 'border-b border-base-300' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Link to={`/user/${suggestedUser.id}`} className="flex-shrink-0">
                      <Avatar 
                        src={suggestedUser.avatar_url}
                        alt={suggestedUser.username || 'Usuario'}
                        name={suggestedUser.username || 'Usuario'}
                        team={suggestedUser.team}
                        size="md"
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/user/${suggestedUser.id}`} className="block">
                        <h3 className="font-bold text-base truncate hover:underline">
                          {suggestedUser.username}
                        </h3>
                        <p className="text-sm text-base-content/60 truncate">
                          @{suggestedUser.username?.toLowerCase()}
                        </p>
                        {suggestedUser.team && (
                          <p className="text-xs text-base-content/50 mt-1">
                            ⚽ Hincha de {suggestedUser.team}
                          </p>
                        )}
                      </Link>
                    </div>
                    
                    <button 
                      onClick={() => handleFollowUser(suggestedUser.id)}
                      disabled={followingStates[suggestedUser.id]}
                      className="btn btn-sm btn-primary rounded-full px-6 flex-shrink-0"
                    >
                      {followingStates[suggestedUser.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Seguir'
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-base-content/40" />
                <p className="text-sm text-base-content/60">No hay usuarios sugeridos en este momento</p>
              </div>
            )}
            
            <div className="p-4">
              <Link 
                to="/a-quien-seguir"
                className="text-primary hover:underline text-sm font-medium"
              >
                Ver más sugerencias
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Modal para crear post */}
      {showPostModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowPostModal(false)}
          ></div>
          
          <div className="relative bg-base-100 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-base-300">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h3 className="font-bold text-lg">Crear post</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowPostModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-0">
              <PostComposer 
                isModal={true}
                onPostCreated={handlePostCreated}
                onClose={() => setShowPostModal(false)}
                placeholder="¿Qué está pasando en el fútbol?"
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default Explorar