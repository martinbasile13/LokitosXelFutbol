import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AlertSystem from './components/UI/AlertSystem'
import VideoViewer from './components/Media/VideoViewer'
import ParaTi from './pages/ParaTi'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import FollowersFollowing from './pages/FollowersFollowing'
import Notificaciones from './pages/Notificaciones'
import AQuienSeguir from './pages/AQuienSeguir'
import Explorar from './pages/Explorar' // Importar el nuevo componente
import Auth from './pages/Auth'
import './Styles/index.css'

// Componentes temporales para las otras rutas
const Partidos = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-100">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">⚽ Partidos</h1>
      <p className="text-lg text-base-content/70">
        Esta sección estará disponible próximamente
      </p>
      <p className="text-sm text-base-content/50 mt-2">
        Aquí mostraremos estadísticas, fixtures y datos de la API de fútbol
      </p>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-base-100" data-theme="dim">
          {/* Sistema de alertas global */}
          <AlertSystem />
          
          <Routes>
            {/* Ruta pública de autenticación */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Rutas protegidas */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Routes>
                  {/* Redirigir raíz a Para Ti */}
                  <Route path="/" element={<Navigate to="/para-ti" replace />} />
                  
                  {/* Rutas principales */}
                  <Route path="/para-ti" element={<ParaTi />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  <Route path="/video/:postId" element={<VideoViewer />} />
                  <Route path="/partidos" element={<Partidos />} />
                  
                  {/* Rutas de perfil unificadas - TODAS usan /user/:userHandle */}
                  <Route path="/user/:userHandle" element={<UserProfile />} />
                  
                  {/* Rutas de seguidores y seguidos */}
                  <Route path="/user/:userHandle/followers" element={<FollowersFollowing />} />
                  <Route path="/user/:userHandle/following" element={<FollowersFollowing />} />
                  
                  {/* Redirigir /perfil a /user/mi-handle */}
                  <Route path="/perfil" element={<Navigate to="/user/me" replace />} />
                  
                  {/* Rutas de navegación */}
                  <Route path="/explorar" element={<Explorar />} />
                  <Route path="/notificaciones" element={<Notificaciones />} />
                  <Route path="/a-quien-seguir" element={<AQuienSeguir />} />
                  
                  {/* Ruta catch-all */}
                  <Route path="*" element={<Navigate to="/para-ti" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
