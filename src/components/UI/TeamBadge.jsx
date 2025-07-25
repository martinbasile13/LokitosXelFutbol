import { getEscudoByTeam } from '../../data/equipos'

const TeamBadge = ({ 
  team, 
  size = 'md', 
  showName = false, 
  className = '' 
}) => {
  if (!team) return null

  const escudoUrl = getEscudoByTeam(team)
  if (!escudoUrl) return null

  const sizes = {
    xs: 'w-4 h-4',    // 16px - muy pequeño
    sm: 'w-5 h-5',    // 20px - móvil
    md: 'w-6 h-6',    // 24px - posts (RECOMENDADO)
    lg: 'w-8 h-8',    // 32px - perfiles
    xl: 'w-12 h-12'   // 48px - perfil completo
  }

  const sizeClass = sizes[size] || sizes.md

  if (showName) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img 
          src={escudoUrl}
          alt={`Escudo de ${team}`}
          className={`${sizeClass} object-contain`}
          loading="lazy"
        />
        <span className="text-sm font-medium truncate">{team}</span>
      </div>
    )
  }

  return (
    <img 
      src={escudoUrl}
      alt={`Escudo de ${team}`}
      className={`${sizeClass} object-contain ${className}`}
      loading="lazy"
      title={team}
    />
  )
}

export default TeamBadge