import { User, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../UI/Avatar'

const ProfileDropdown = ({ 
  userProfile, 
  showDropdown, 
  onClose, 
  onLogout 
}) => {
  if (!showDropdown) return null

  return (
    <div 
      className="fixed top-20 right-4 bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden min-w-64"
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div className="py-2">
        {/* Información del usuario en el dropdown */}
        <div className="px-4 py-3 border-b border-base-300">
          <div className="flex items-center space-x-3">
            <Avatar 
              src={userProfile?.avatar_url}
              alt={userProfile?.username || 'Usuario'}
              name={userProfile?.username || 'Usuario'}
              team={userProfile?.team}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{userProfile?.username}</p>
              <p className="text-xs text-base-content/60 truncate">@{userProfile?.username?.toLowerCase()}</p>
            </div>
          </div>
        </div>

        {/* Opciones del menú */}
        <div className="py-1">
          <Link 
            to={`/user/${userProfile?.handle || 'me'}`}
            className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors"
            onClick={onClose}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <User className="w-4 h-4 text-base-content/60" />
            </div>
            <span className="text-sm font-medium">Ver perfil</span>
          </Link>

          <div className="border-t border-base-300 my-1"></div>

          <button 
            className="flex items-center space-x-3 px-4 py-3 hover:bg-base-200 transition-colors w-full text-left text-error"
            onClick={() => {
              onClose()
              onLogout()
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Cerrar sesión @{userProfile?.username}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileDropdown