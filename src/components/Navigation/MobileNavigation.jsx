import { Link, useLocation } from 'react-router-dom'

const MobileNavigation = () => {
  const location = useLocation()

  const navItems = [
    {
      path: '/para-ti',
      label: 'Inicio',
      isActive: location.pathname === '/para-ti' || location.pathname === '/',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      )
    },
    {
      path: '/explorar',
      label: 'Buscar',
      isActive: location.pathname === '/explorar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      )
    },
    {
      path: '/notificaciones',
      label: 'Notif',
      isActive: location.pathname === '/notificaciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 17H1l5 5v-5z"/>
        </svg>
      )
    },
    {
      path: '/perfil',
      label: 'Perfil',
      isActive: location.pathname === '/perfil',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 md:hidden z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center p-2 ${
              item.isActive ? 'text-primary' : 'text-base-content/60'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default MobileNavigation