import { useState, useEffect, useRef, useCallback } from 'react'

// Hook para manejar scroll infinito inteligente
export const useInfiniteScroll = (config = {}) => {
  const {
    loadFunction,
    bufferSize = 20,
    loadThreshold = 5,
    cleanupThreshold = 25,
    postsPerLoad = 10,
    initialLoading = true
  } = config

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(initialLoading)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const isLoadingRef = useRef(false)

  // Configurar intersection observer para detectar scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index)
            const remaining = items.length - index - 1
            
            // Cargar más items cuando queden pocos por ver
            if (remaining <= loadThreshold && hasMore && !isLoadingRef.current) {
              loadMore()
            }
          }
        })
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      }
    )

    // Observar los últimos elementos
    const elements = document.querySelectorAll('[data-index]')
    const lastFewElements = Array.from(elements).slice(-loadThreshold)
    lastFewElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [items, hasMore, loadThreshold])

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

  // Cargar más datos
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !loadFunction) return
    
    try {
      setLoadingMore(true)
      isLoadingRef.current = true
      
      const newData = await loadFunction(postsPerLoad, currentOffset)
      
      if (!newData || newData.length === 0) {
        setHasMore(false)
        return
      }

      setItems(prevItems => {
        const updatedItems = [...prevItems, ...newData]
        
        // Limpiar items antiguos si superamos el threshold
        if (updatedItems.length > cleanupThreshold) {
          const itemsToRemove = updatedItems.length - bufferSize
          const cleanedItems = updatedItems.slice(itemsToRemove)
          
          setCurrentOffset(prev => prev + postsPerLoad)
          return cleanedItems
        }
        
        setCurrentOffset(prev => prev + postsPerLoad)
        return updatedItems
      })
      
      setHasMore(newData.length === postsPerLoad)
      
    } catch (error) {
      console.error('Error loading more data:', error)
    } finally {
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [currentOffset, hasMore, loadFunction, postsPerLoad, bufferSize, cleanupThreshold])

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