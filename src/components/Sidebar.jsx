import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const menuItems = [
    { name: 'Inicio', icon: '🏠', path: '/para-ti' },
    { name: 'Explorar', icon: '🔍', path: '/explorar' },
    { name: 'Notificaciones', icon: '🔔', path: '/notificaciones' },
    { name: 'Mensajes', icon: '✉️', path: '/mensajes' },
    { name: 'Perfil', icon: '👤', path: '/perfil' },
    { name: 'Más', icon: '⋯', path: '/mas' },
  ]

  return (
    <div className="p-4 h-full">
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 p-3 rounded-xl hover:bg-base-200 transition-colors w-full ${
              location.pathname === item.path ? 'bg-primary text-primary-content' : ''
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium hidden xl:block">{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Botón para crear post */}
      <div className="mt-8">
        <button className="btn btn-primary w-full rounded-full">
          <span className="xl:hidden">✏️</span>
          <span className="hidden xl:inline">Opinar</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar 