import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  User, 
  MoreHorizontal, 
  PenTool 
} from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const menuItems = [
    { name: 'Inicio', icon: Home, path: '/para-ti' },
    { name: 'Explorar', icon: Search, path: '/explorar' },
    { name: 'Notificaciones', icon: Bell, path: '/notificaciones' },
    { name: 'Mensajes', icon: Mail, path: '/mensajes' },
    { name: 'Perfil', icon: User, path: '/perfil' },
    { name: 'Más', icon: MoreHorizontal, path: '/mas' },
  ]

  return (
    <div className="p-4 h-full">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-xl hover:bg-base-200 transition-all duration-200 w-full group ${
                isActive ? 'bg-primary text-primary-content' : ''
              }`}
            >
              <IconComponent className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                isActive ? '' : 'group-hover:text-primary'
              }`} />
              <span className="font-medium hidden xl:block">{item.name}</span>
            </Link>
          )
        })}
      </div>

      {/* Botón para crear post */}
      <div className="mt-8">
        <button className="btn btn-primary w-full rounded-full hover:scale-105 transition-transform">
          <span className="hidden xl:inline">
            Opinar
          </span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar 