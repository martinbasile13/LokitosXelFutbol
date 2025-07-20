import { useState, useEffect } from 'react'
import TeamBadge from './TeamBadge'

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

  // Obtener escudo del equipo
  const getTeamBadge = () => {
    if (!team || team === 'Sin Equipo') return null
    
    try {
      // Mapear equipos a archivos de escudos
      const teamFiles = {
        'Boca Juniors': 'boca.png',
        'River Plate': 'river.png',
        'Racing Club': 'racing.png',
        'Independiente': 'independiente.png',
        'San Lorenzo': 'san_lorenzo.png',
        'Estudiantes': 'estudiantes.png',
        'Gimnasia y Esgrima La Plata': 'gimnasia.png',
        'Lanús': 'lanus.png',
        'Banfield': 'banfield.png',
        'Tigre': 'tigre.png',
        'Argentinos Juniors': 'argentinos.png',
        'Vélez Sarsfield': 'velez.png',
        'Huracán': 'huracan.png',
        'Newells Old Boys': 'newells.png',
        'Rosario Central': 'rosario_central.png',
        'Central Córdoba': 'central_cordoba.png',
        'Talleres': 'talleres.png',
        'Instituto': 'instituto.png',
        'Belgrano': 'belgrano.png',
        'Godoy Cruz': 'godoy_cruz.png',
        'Deportivo Riestra': 'riestra.png',
        'Atlético Tucumán': 'atletico_tucuman.png',
        'Unión': 'union.png',
        'Defensa y Justicia': 'defensa.png',
        'Platense': 'platense.png',
        'Barracas Central': 'barracas.png',
        'Sarmiento': 'sarmiento.png',
        'Independiente Rivadavia': 'independiente_rivadavia.png'
      }

      const fileName = teamFiles[team]
      if (fileName) {
        return `/equipos/${fileName}`
      }
      return null
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