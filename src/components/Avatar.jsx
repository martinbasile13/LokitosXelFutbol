import { useState, useEffect } from 'react'

const Avatar = ({ 
  src, 
  alt = "Avatar", 
  name = "", 
  size = "md", 
  className = "",
  onClick = null 
}) => {
  // Tamaños simplificados
  const sizes = {
    xs: { container: "w-6 h-6", text: "text-xs" },
    sm: { container: "w-8 h-8", text: "text-sm" },
    md: { container: "w-12 h-12", text: "text-lg" },
    lg: { container: "w-16 h-16", text: "text-xl" },
    xl: { container: "w-20 h-20", text: "text-2xl" },
  }

  const sizeConfig = sizes[size] || sizes.md
  const [showImage, setShowImage] = useState(false)

  // Obtener inicial del nombre
  const getInitial = () => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
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

  return (
    <div className={`avatar ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      <div className={`${sizeConfig.container} rounded-full overflow-hidden relative flex items-center justify-center ${
        hasValidSrc && showImage 
          ? 'bg-base-200' 
          : 'bg-gradient-to-br from-blue-400 to-blue-600'
      }`}>
        {/* Imagen */}
        {hasValidSrc && showImage && (
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setShowImage(false)}
          />
        )}
        
        {/* Inicial cuando no hay imagen o falla */}
        {(!hasValidSrc || !showImage) && (
          <span className={`${sizeConfig.text} font-bold text-white select-none`}>
            {getInitial()}
          </span>
        )}
      </div>
    </div>
  )
}

export default Avatar