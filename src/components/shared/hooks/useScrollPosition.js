import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Almacén global simple para las posiciones de scroll
const scrollPositions = new Map()

export const useScrollRestore = () => {
  const location = useLocation()

  // Guardar posición actual
  const saveScrollPosition = (key = location.pathname) => {
    const scrollY = window.scrollY || window.pageYOffset
    scrollPositions.set(key, scrollY)
    console.log(`💾 Guardando scroll posición ${scrollY} para ${key}`)
  }

  // Restaurar posición guardada
  const restoreScrollPosition = (key = location.pathname) => {
    const savedPosition = scrollPositions.get(key)
    if (savedPosition !== undefined && savedPosition > 0) {
      console.log(`🔄 Restaurando scroll posición ${savedPosition} para ${key}`)
      
      // Usar múltiples intentos para asegurar que funcione
      const attempts = [50, 100, 200, 300]
      
      attempts.forEach((delay, index) => {
        setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            behavior: 'instant'
          })
          console.log(`📍 Intento ${index + 1}: scrollTo(${savedPosition})`)
        }, delay)
      })
    } else {
      console.log(`❌ No hay posición válida guardada para ${key}`)
    }
  }

  return {
    saveScrollPosition,
    restoreScrollPosition
  }
}

// Hook específico para páginas de feed que auto-restaura
export const useAutoScrollRestore = () => {
  const location = useLocation()
  const { restoreScrollPosition } = useScrollRestore()

  useEffect(() => {
    // Solo restaurar en páginas de feed principales
    if (location.pathname === '/' || location.pathname === '/para-ti') {
      console.log(`🏠 Página de feed detectada: ${location.pathname}`)
      // Esperar un poco más para que el contenido esté cargado
      setTimeout(() => {
        restoreScrollPosition(location.pathname)
      }, 250)
    }
  }, [location.pathname, restoreScrollPosition])

  return { restoreScrollPosition }
}