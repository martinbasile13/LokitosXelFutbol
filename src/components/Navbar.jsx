import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { 
  MoreHorizontal, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react'

const Navbar = () => {
  const location = useLocation()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost">
          <img 
            src="/logo/logo.png" 
            alt="LokitosXelFutbol" 
            className="h-50 w-auto"
          />
        </Link>
      </div>

      <div className="navbar-center">
        <div className="tabs tabs-boxed">
          <Link 
            to="/partidos" 
            className={`tab ${location.pathname === '/partidos' ? 'tab-active' : ''}`}
          >
            Partidos
          </Link>
          <Link 
            to="/para-ti" 
            className={`tab ${location.pathname === '/para-ti' || location.pathname === '/' ? 'tab-active' : ''}`}
          >
            Para Ti
          </Link>
        </div>
      </div>

      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost hover:bg-base-200 transition-colors group">
            <MoreHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow border border-base-300">
            <li>
              <Link to="/perfil" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil
              </Link>
            </li>
            <li>
              <a className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </a>
            </li>
            <li>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-error hover:bg-error hover:text-error-content">
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar 