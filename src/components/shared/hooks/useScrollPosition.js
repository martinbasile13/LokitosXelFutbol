import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Almacén simple - solo posición de scroll
const scrollPositions = new Map()

export const useScrollRestore = () => {
  const location = useLocation()

  // Guardar posición - SIEMPRE, sin condiciones
  const saveScrollPosition = (key = location.pathname) => {
    const scrollY = window.scrollY || window.pageYOffset
    scrollPositions.set(key, scrollY)
    console.log(`💾 SIEMPRE guardando posición: ${scrollY} para ${key}`)
  }

  // Restaurar posición - SIMPLE
  const restoreScrollPosition = (key = location.pathname) => {
    const savedPosition = scrollPositions.get(key)
    if (savedPosition !== undefined && savedPosition > 0) {
      console.log(`🔄 Restaurando posición simple: ${savedPosition}`)
      
      // Un solo intento, directo
      setTimeout(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant'
        })
      }, 100)
    } else {
      console.log(`❌ No hay posición guardada para ${key}`)
    }
  }

  return {
    saveScrollPosition,
    restoreScrollPosition
  }
}

// Auto-restore SIMPLE
export const useAutoScrollRestore = () => {
  const location = useLocation()
  const { restoreScrollPosition } = useScrollRestore()

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/para-ti') {
      console.log(`🏠 Página de feed: ${location.pathname}`)
      
      // Solo restaurar si estamos en la parte superior
      if (window.scrollY === 0) {
        setTimeout(() => {
          restoreScrollPosition(location.pathname)
        }, 300)
      }
    }
  }, [location.pathname])

  return { restoreScrollPosition }
}