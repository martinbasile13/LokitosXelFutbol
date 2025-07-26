import { useState, useEffect } from 'react'
import TeamBadge from './TeamBadge'
import { getEscudoByTeam } from '../../data/equipos'

const Avatar = ({ 
  src, 
  alt = "Avatar", 
  name = "", 
  team = null, // Nueva prop para el equipo del usuario
  size = "md", 
  className = "",
  onClick = null 
}) => {
  // Tamaños simplificados
  const sizes = {
    xs: { container: "w-6 h-6", text: "text-xs", badgeSize: "16" },
    sm: { container: "w-8 h-8", text: "text-sm", badgeSize: "20" },
    md: { container: "w-12 h-12", text: "text-lg", badgeSize: "32" },
    lg: { container: "w-16 h-16", text: "text-xl", badgeSize: "48" },
    xl: { container: "w-20 h-20", text: "text-2xl", badgeSize: "64" },
  }

  const sizeConfig = sizes[size] || sizes.md
  const [showImage, setShowImage] = useState(false)

  // Obtener inicial del nombre
  const getInitial = () => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  // Obtener escudo del equipo usando la función centralizada
  const getTeamBadge = () => {
    if (!team || team === 'Sin Equipo') return null
    
    try {
      return getEscudoByTeam(team)
    } catch (error) {
      console.error('Error getting team badge:', error)
      return null
    }
  }

  // Verificar si tenemos una URL válida
  const hasValidSrc = src && src.trim() !== ''

  useEffect(() => {
    if (hasValidSrc) {
      // Test simple de imagen
      const img = new Image()
      img.onload = () => setShowImage(true)
      img.onerror = () => setShowImage(false)
      img.src = src
    } else {
      setShowImage(false)
    }
  }, [src, hasValidSrc])

  const teamBadgeUrl = getTeamBadge()

  return (
    <div className={`avatar ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      <div className={`${sizeConfig.container} rounded-full overflow-hidden relative flex items-center justify-center ${
        hasValidSrc && showImage 
          ? 'bg-base-200' 
          : 'bg-gradient-to-br from-blue-400 to-blue-600'
      }`}>
        {/* Imagen del usuario */}
        {hasValidSrc && showImage && (
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setShowImage(false)}
          />
        )}
        
        {/* Escudo del equipo o pelota cuando no hay imagen de usuario */}
        {(!hasValidSrc || !showImage) && (
          <div className="w-full h-full flex items-center justify-center">
            {teamBadgeUrl ? (
              // Mostrar escudo del equipo
              <img 
                src={teamBadgeUrl}
                alt={`Escudo de ${team}`}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  console.error('Error loading team badge:', teamBadgeUrl)
                  // Si falla cargar el escudo, mostrar pelota
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : null}
            
            {/* Pelota como fallback */}
            <span 
              className={`${sizeConfig.text} select-none ${teamBadgeUrl ? 'hidden' : 'block'}`}
              style={{ display: teamBadgeUrl ? 'none' : 'block' }}
            >
              ⚽
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Avatar