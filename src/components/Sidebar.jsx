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
    <div className="h-full flex flex-col">
      {/* Logo en la parte superior como Twitter */}
      <div className="p-2 py-3">
        <Link to="/" className="flex justify-center xl:justify-start">
          <div className="">
            <img 
              src="/logo/finalLogo.png" 
              alt="LokitosXelFutbol" 
              className=""
            />
          </div>
        </Link>
      </div>

      {/* Menú de navegación */}
      <div className="flex-1 px-2">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-4 p-3 rounded-full hover:bg-base-200 transition-all duration-200 w-full group ${
                  isActive ? 'font-bold' : ''
                }`}
              >
                <IconComponent className={`w-7 h-7 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-primary' : ''
                }`} />
                <span className={`text-xl hidden xl:block ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Botón para crear post estilo Twitter */}
        <div className="mt-8 px-2">
          <button className="btn btn-primary w-full xl:w-full rounded-full hover:scale-105 transition-transform py-3 text-lg font-bold">
            <span className="hidden xl:inline">Opinar</span>
            <PenTool className="w-6 h-6 xl:hidden" />
          </button>
        </div>
      </div>

      {/* Footer con enlaces legales */}
      <div className="hidden xl:block p-4 text-xs text-base-content/50 space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="#" className="hover:underline">Términos de Servicio</a>
          <a href="#" className="hover:underline">Política de Privacidad</a>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="#" className="hover:underline">Política de Cookies</a>
          <a href="#" className="hover:underline">Accesibilidad</a>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="#" className="hover:underline">Información de anuncios</a>
          <a href="#" className="hover:underline">Más...</a>
        </div>
        <p className="mt-2">© 2025 LokitosXelFutbol Corp.</p>
      </div>
    </div>
  )
}

export default Sidebar