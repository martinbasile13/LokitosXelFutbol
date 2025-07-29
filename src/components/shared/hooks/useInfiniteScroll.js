import { useState, useEffect, useRef, useCallback } from 'react'

// Estado global para persistir posts entre navegaciones
const globalPostsState = new Map()
const positionAnchors = new Map() // Nuevo: guardar anclas de posición
const MAX_POSTS = 50 // Límite estricto de posts
const LOAD_MORE_THRESHOLD = 45 // Empezar limpieza cuando llegue a 45

// Hook para manejar scroll infinito inteligente
export const useInfiniteScroll = (config = {}) => {
  const {
    loadFunction,
    bufferSize = 20,
    loadThreshold = 5,
    cleanupThreshold = 25,
    postsPerLoad = 10,
    initialLoading = true,
    stateKey = 'default' // Clave para identificar el estado
  } = config

  // Inicializar estado desde el estado global si existe
  const getInitialState = () => {
    const savedState = globalPostsState.get(stateKey)
    if (savedState) {
      console.log(`🔄 Restaurando estado global: ${savedState.items.length} posts`)
      // Si hay demasiados posts guardados, tomar solo los más recientes
      if (savedState.items.length > MAX_POSTS) {
        const recentPosts = savedState.items.slice(0, MAX_POSTS)
        console.log(`⚡ Optimizando DOM: ${savedState.items.length} → ${recentPosts.length} posts`)
        return {
          ...savedState,
          items: recentPosts
        }
      }
      return savedState
    }
    return {
      items: [],
      currentOffset: 0,
      hasMore: true
    }
  }

  const initialState = getInitialState()
  const [items, setItems] = useState(initialState.items)
  const [loading, setLoading] = useState(initialState.items.length === 0 ? initialLoading : false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialState.hasMore)
  const [currentOffset, setCurrentOffset] = useState(initialState.currentOffset)
  const isLoadingRef = useRef(false)
  
  // Refs para mantener valores actuales y evitar problemas de closure
  const itemsRef = useRef([])
  const currentOffsetRef = useRef(0)
  const hasMoreRef = useRef(true)

  // Mantener refs sincronizados con states
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    currentOffsetRef.current = currentOffset
  }, [currentOffset])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  // Guardar estado en el almacén global cada vez que cambie
  useEffect(() => {
    globalPostsState.set(stateKey, {
      items,
      currentOffset,
      hasMore
    })
    console.log(`💾 Estado global actualizado: ${items.length} posts`)
  }, [items, currentOffset, hasMore, stateKey])

  // Scroll listener más confiable que Intersection Observer
  useEffect(() => {
    const handleScroll = () => {
      // Verificar si estamos cerca del final de la página
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Calcular cuánto falta para llegar al final
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight)
      
      // Si estamos a menos de 1000px del final, cargar más
      if (distanceFromBottom < 1000 && hasMore && !isLoadingRef.current) {
        loadMore()
      }
    }

    // Agregar listener de scroll con throttling
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledScroll)
    }
  }, [hasMore]) // Solo depende de hasMore, no de items

  // Cargar datos iniciales
  const loadInitial = async () => {
    if (!loadFunction) return

    try {
      setLoading(true)
      isLoadingRef.current = true
      
      const data = await loadFunction(bufferSize, 0)
      setItems(data || [])
      setCurrentOffset(bufferSize)
      setHasMore((data || []).length === bufferSize)
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      setItems([])
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  // Función para guardar ancla de posición antes de limpiar
  const savePositionAnchor = () => {
    const currentScrollY = window.scrollY
    const viewportMiddle = currentScrollY + (window.innerHeight / 2)
    
    // Encontrar el post más cercano al centro del viewport
    const postElements = document.querySelectorAll('[data-index]')
    let closestPost = null
    let closestDistance = Infinity
    
    postElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const elementCenter = currentScrollY + rect.top + (rect.height / 2)
      const distance = Math.abs(elementCenter - viewportMiddle)
      
      if (distance < closestDistance) {
        closestDistance = distance
        const postCard = element.querySelector('[data-post-id]')
        if (postCard) {
          closestPost = {
            postId: postCard.getAttribute('data-post-id'),
            index: parseInt(element.getAttribute('data-index') || '0'),
            offsetFromTop: rect.top,
            scrollY: currentScrollY
          }
        }
      }
    })
    
    if (closestPost) {
      positionAnchors.set(stateKey, closestPost)
      console.log(`⚓ Ancla guardada - Post: ${closestPost.postId}, Index: ${closestPost.index}, Offset: ${closestPost.offsetFromTop}`)
      return closestPost
    }
    
    return null
  }

  // Función para restaurar posición basada en ancla
  const restoreFromAnchor = () => {
    const anchor = positionAnchors.get(stateKey)
    if (!anchor) return false
    
    console.log(`🎯 Intentando restaurar desde ancla: ${anchor.postId}`)
    
    // Buscar el post ancla en el DOM actual
    const targetElement = document.querySelector(`[data-post-id="${anchor.postId}"]`)
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      const currentScrollY = window.scrollY
      const targetScrollY = currentScrollY + rect.top - anchor.offsetFromTop
      
      console.log(`✅ Ancla encontrada - restaurando posición: ${targetScrollY}`)
      
      setTimeout(() => {
        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'instant'
        })
      }, 100)
      
      return true
    }
    
    console.log(`❌ Ancla perdida - post ${anchor.postId} no encontrado`)
    return false
  }

  // Cargar más datos con límite estricto
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current || !loadFunction) {
      console.log('🚫 loadMore cancelado:', { 
        isLoading: isLoadingRef.current, 
        hasMore: hasMoreRef.current, 
        hasLoadFunction: !!loadFunction 
      })
      return
    }
    
    try {
      setLoadingMore(true)
      isLoadingRef.current = true
      
      console.log('🔄 Cargando más posts con offset:', currentOffsetRef.current)
      console.log('📊 Posts actuales en memoria:', itemsRef.current.length)
      
      const newData = await loadFunction(postsPerLoad, currentOffsetRef.current)
      console.log('📦 Posts nuevos recibidos:', newData?.length || 0)
      
      if (!newData || newData.length === 0) {
        console.log('🏁 No hay más posts disponibles')
        setHasMore(false)
        return
      }

      // Verificar duplicados
      const currentIds = new Set(itemsRef.current.map(item => item.id))
      const uniqueNewData = newData.filter(item => !currentIds.has(item.id))
      
      if (uniqueNewData.length === 0) {
        console.log('🔄 No hay posts únicos, incrementando offset')
        setCurrentOffset(prev => prev + postsPerLoad)
        setLoadingMore(false)
        isLoadingRef.current = false
        return
      }

      setItems(prevItems => {
        const updatedItems = [...prevItems, ...uniqueNewData]
        
        // LÍMITE ESTRICTO: Si superamos 50 posts, hacer ventana deslizante
        if (updatedItems.length > MAX_POSTS) {
          console.log(`🔄 Límite alcanzado: ${updatedItems.length} posts, aplicando ventana deslizante`)
          
          // Guardar ancla de posición ANTES de limpiar
          const anchor = savePositionAnchor()
          
          // Mantener solo los últimos 40 posts para dar margen
          const postsToKeep = 40
          const keptItems = updatedItems.slice(-postsToKeep)
          
          console.log(`✂️ Ventana deslizante: ${updatedItems.length} → ${keptItems.length} posts`)
          
          // Intentar restaurar posición después de la limpieza
          setTimeout(() => {
            if (!restoreFromAnchor() && anchor) {
              // Fallback: scroll aproximado basado en proporción
              const proportion = anchor.index / updatedItems.length
              const newScrollY = proportion * document.documentElement.scrollHeight
              console.log(`🔄 Fallback proporcional: ${newScrollY}`)
              window.scrollTo({ top: newScrollY, behavior: 'instant' })
            }
          }, 200)
          
          return keptItems
        }
        
        console.log('📊 Total posts después de agregar:', updatedItems.length)
        return updatedItems
      })
      
      setCurrentOffset(prev => {
        const newOffset = prev + uniqueNewData.length
        console.log('⬆️ Actualizando offset de', prev, 'a', newOffset)
        return newOffset
      })
      
      setHasMore(newData.length === postsPerLoad)
      
    } catch (error) {
      console.error('💥 Error loading more data:', error)
    } finally {
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [loadFunction, postsPerLoad]) // Removido 'items' de las dependencias

  // Agregar item al inicio
  const addItem = (newItem) => {
    setItems(prev => [newItem, ...prev])
  }

  // Remover item
  const removeItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Actualizar item
  const updateItem = (itemId, updateData) => {
    setItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, ...updateData }
          : item
      )
    )
  }

  // Refrescar completamente
  const refresh = () => {
    setItems([])
    setCurrentOffset(0)
    setHasMore(true)
    loadInitial()
  }

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    loadInitial,
    loadMore,
    addItem,
    removeItem,
    updateItem,
    refresh,
    setItems
  }
}