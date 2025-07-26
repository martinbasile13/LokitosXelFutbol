import { MoreHorizontal } from 'lucide-react'
import TeamBadge from '../UI/TeamBadge'
import ProfileDropdown from './ProfileDropdown'

const UserProfileCard = ({ 
  user,
  userProfile, 
  userStats,
  showProfileDropdown,
  setShowProfileDropdown,
  profileDropdownRef,
  onLogout
}) => {
  const getDisplayName = (profile) => {
    return profile?.username || 'Usuario'
  }

  if (!user || !userProfile) return null

  return (
    <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300 relative" ref={profileDropdownRef}>
      {/* Header azul (placeholder para imagen posterior) */}
      <div className="h-16 bg-primary"></div>
      
      {/* Contenido del perfil */}
      <div className="p-4 -mt-8">
        {/* Layout horizontal: Avatar izquierda, info derecha */}
        <div className="flex items-start space-x-3 mb-3">
          {/* Avatar a la izquierda - CIRCULAR */}
          <div className="w-16 h-16 border-4 border-base-100 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile?.username || 'Usuario'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white">
                {(userProfile?.username || 'Usuario').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Info en el medio */}
          <div className="flex-1 pt-4">
            <h3 className="font-bold text-base text-white">{getDisplayName(userProfile)}</h3>
            <p className="text-base-content/60 text-sm">@{userProfile?.handle || userProfile?.username?.toLowerCase() || 'usuario'}</p>
          </div>

          {/* Icono de menú y badge del equipo */}
          <div className="flex items-center space-x-2 pt-4">
            {userProfile?.team && (
              <>
                <TeamBadge team={userProfile.team} size="md" />
                <span className="text-xs text-primary font-medium leading-none">
                  {userProfile.team}
                </span>
              </>
            )}
            {/* BOTÓN DE TRES PUNTITOS FUNCIONAL */}
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors ml-2"
            >
              <MoreHorizontal className="w-6 h-6 text-base-content/60" />
            </button>
          </div>
        </div>
        
        {/* Estadísticas en fila horizontal compacta - XP EN LUGAR DE POSTS */}
        <div className="flex justify-between text-center">
          <div>
            <div className="font-bold text-primary text-lg">{userProfile?.experience_points || 0}</div>
            <div className="text-base-content/70 text-xs">XP</div>
          </div>
          <div>
            <div className="font-bold text-primary text-lg">{userStats.followers}</div>
            <div className="text-base-content/70 text-xs">Seguidores</div>
          </div>
          <div>
            <div className="font-bold text-primary text-lg">{userStats.following}</div>
            <div className="text-base-content/70 text-xs">Siguiendo</div>
          </div>
        </div>
      </div>

      {/* Dropdown del perfil */}
      <ProfileDropdown 
        userProfile={userProfile}
        showDropdown={showProfileDropdown}
        onClose={() => setShowProfileDropdown(false)}
        onLogout={onLogout}
      />
    </div>
  )
}

export default UserProfileCard