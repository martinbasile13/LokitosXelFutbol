import { useState, useEffect } from 'react'

const Avatar = ({ 
  src, 
  alt = "Avatar", 
  name = "", 
  size = "md", 
  className = "",
  onClick = null 
}) => {
  // Definir tamaños estandarizados (width y height iguales para mantener círculo perfecto)
  const sizes = {
    xs: { container: "w-6 h-6", text: "text-xs" }, // 24px - muy pequeño
    sm: { container: "w-8 h-8", text: "text-sm" }, // 32px - pequeño  
    md: { container: "w-12 h-12", text: "text-lg" }, // 48px - mediano (default)
    lg: { container: "w-16 h-16", text: "text-xl" }, // 64px - grande
    xl: { container: "w-20 h-20", text: "text-2xl" }, // 80px - extra grande
  }

  const sizeConfig = sizes[size] || sizes.md
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset del estado cuando cambia la src
  useEffect(() => {
    if (src) {
      setImageError(false)
      setImageLoaded(false)
    }
  }, [src])

  const handleError = (e) => {
    setImageError(true)
  }

  const handleLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  // Obtener la primera letra del nombre
  const getInitial = () => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  // Determinar si mostrar imagen o inicial
  const shouldShowImage = src && !imageError && imageLoaded
  const shouldShowInitial = !src || imageError

  return (
    <div className={`avatar ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      <div className={`${sizeConfig.container} rounded-full overflow-hidden ring ring-primary ring-offset-base-100 ring-offset-1 relative`}>
        {/* Imagen del avatar */}
        {src && (
          <img 
            src={src} 
            alt={alt}
            onError={handleError}
            onLoad={handleLoad}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              shouldShowImage ? 'opacity-100' : 'opacity-0 absolute'
            }`}
            style={{ display: shouldShowImage ? 'block' : 'none' }}
          />
        )}
        
        {/* Inicial del nombre cuando no hay imagen */}
        {shouldShowInitial && (
          <div className={`w-full h-full bg-primary flex items-center justify-center ${sizeConfig.text} font-bold text-black`}>
            {getInitial()}
          </div>
        )}
      </div>
    </div>
  )
}

export default Avatar 