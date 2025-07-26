import { useState, useEffect } from 'react'

// Hook para manejar estados de loading con diferentes tipos
export const usePageLoading = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading)
  const [loadingType, setLoadingType] = useState('default')
  const [loadingText, setLoadingText] = useState('Cargando...')

  const startLoading = (type = 'default', text = 'Cargando...') => {
    setLoadingType(type)
    setLoadingText(text)
    setLoading(true)
  }

  const stopLoading = () => {
    setLoading(false)
    setLoadingType('default')
    setLoadingText('Cargando...')
  }

  return {
    loading,
    loadingType,
    loadingText,
    startLoading,
    stopLoading,
    setLoading // Para compatibilidad directa
  }
}

// Hook para manejar tabs dinámicos
export const usePageTabs = (initialTab = null, tabs = []) => {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.id)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
  }

  const getActiveTabData = () => {
    return tabs.find(tab => tab.id === activeTab)
  }

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    getActiveTabData
  }
}

// Hook para manejar estados vacíos con configuración dinámica
export const useEmptyState = (isEmpty = false, config = {}) => {
  const defaultConfig = {
    icon: '📭',
    title: 'Sin contenido',
    message: 'No hay elementos para mostrar',
    action: null
  }

  const emptyConfig = { ...defaultConfig, ...config }

  return {
    empty: isEmpty,
    emptyIcon: emptyConfig.icon,
    emptyTitle: emptyConfig.title,
    emptyMessage: emptyConfig.message,
    emptyAction: emptyConfig.action
  }
}

// Hook para manejar modales con estado interno
export const usePageModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const toggleModal = () => setIsOpen(!isOpen)

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen
  }
}

// Hook combinado para páginas complejas
export const usePageState = (config = {}) => {
  const {
    initialTab = null,
    tabs = [],
    initialLoading = false,
    emptyConfig = {}
  } = config

  const loading = usePageLoading(initialLoading)
  const tabsState = usePageTabs(initialTab, tabs)
  const modal = usePageModal()
  const [data, setData] = useState([])

  // Computed empty state basado en data
  const isEmpty = !loading.loading && data.length === 0
  const emptyState = useEmptyState(isEmpty, emptyConfig)

  const refreshData = async (loadFunction) => {
    if (!loadFunction) return

    try {
      loading.startLoading('refresh', 'Actualizando...')
      const result = await loadFunction()
      setData(result || [])
    } catch (error) {
      console.error('Error refreshing data:', error)
      window.showErrorAlert?.('Error al actualizar los datos')
    } finally {
      loading.stopLoading()
    }
  }

  return {
    // Estados de loading
    ...loading,
    
    // Estados de tabs
    ...tabsState,
    
    // Estados de modal
    modal,
    
    // Estados de data
    data,
    setData,
    refreshData,
    
    // Estados vacíos
    ...emptyState
  }
}