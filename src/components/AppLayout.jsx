import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Navigation/Sidebar'
import RightPanel from './RightPanel'
import MobileNavigation from './Navigation/MobileNavigation'
import PostComposer from './PostComposer'
import { ArrowLeft, Loader2, X } from 'lucide-react'

const AppLayout = ({ 
  // Layout básico
  children, 
  showRightPanel = true, 
  maxWidth = "md:max-w-[800px]",
  className = "",
  
  // Header inteligente
  pageTitle,
  pageSubtitle,
  showBackButton = false,
  headerActions,
  customHeader,
  
  // Tabs dinámicos
  tabs,
  activeTab,
  onTabChange,
  
  // Estados de loading
  loading = false,
  loadingText = "Cargando...",
  
  // Estados vacíos
  empty = false,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction,
  
  // Modal de posts
  showPostModal = false,
  onTogglePostModal,
  onPostCreated,
  postModalPlaceholder = "¿Qué está pasando?",
  
  // Configuración avanzada
  stickyHeader = true,
  paddingBottom = true,
  scrollToTop = false
}) => {
  const navigate = useNavigate()
  const [internalPostModal, setInternalPostModal] = useState(false)

  // Scroll to top cuando se especifica
  useEffect(() => {
    if (scrollToTop) {
      window.scrollTo(0, 0)
    }
  }, [scrollToTop])

  // Manejo interno del modal si no se proporciona externo
  const handlePostModal = onTogglePostModal || (() => setInternalPostModal(!internalPostModal))
  const isPostModalOpen = showPostModal || internalPostModal

  const handlePostCreated = (newPost) => {
    if (onPostCreated) {
      onPostCreated(newPost)
    }
    if (onTogglePostModal) {
      onTogglePostModal()
    } else {
      setInternalPostModal(false)
    }
  }

  // Render del header inteligente
  const renderHeader = () => {
    if (customHeader) return customHeader

    if (!pageTitle && !tabs) return null

    return (
      <div className={`${stickyHeader ? 'sticky top-0' : ''} z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300`}>
        {/* Header principal */}
        {pageTitle && (
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <button 
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 transition-colors md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold">{pageTitle}</h1>
                {pageSubtitle && (
                  <p className="text-sm text-base-content/60">{pageSubtitle}</p>
                )}
              </div>
            </div>

            {/* Acciones del header */}
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        )}

        {/* Tabs dinámicos */}
        {tabs && (
          <div className="flex border-b border-base-300">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-base-content/60 hover:text-base-content'
                  }`}
                >
                  {TabIcon && <TabIcon className="w-4 h-4 mr-2 inline" />}
                  {tab.label}
                  {tab.count !== undefined && ` (${tab.count})`}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render del contenido principal
  const renderContent = () => {
    // Estado de loading
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-base-content/70">{loadingText}</p>
          </div>
        </div>
      )
    }

    // Estado vacío
    if (empty) {
      return (
        <div className="text-center py-12">
          {emptyIcon && (
            <div className="mb-4">
              {typeof emptyIcon === 'string' ? (
                <div className="text-6xl mb-4">{emptyIcon}</div>
              ) : (
                emptyIcon
              )}
            </div>
          )}
          {emptyTitle && (
            <h3 className="text-xl font-bold mb-2">{emptyTitle}</h3>
          )}
          {emptyMessage && (
            <p className="text-base-content/60 mb-4">{emptyMessage}</p>
          )}
          {emptyAction}
        </div>
      )
    }

    // Contenido normal
    return children
  }

  return (
    <div className="min-h-screen bg-base-100 flex justify-center">
      {/* Contenedor principal centrado */}
      <div className="flex w-full max-w-7xl">
        {/* Sidebar estilo Twitter - hidden en móvil */}
        <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
          <Sidebar onOpenPostModal={handlePostModal} />
        </div>

        {/* Contenido principal - responsive */}
        <div className={`flex-1 border-r border-base-300 max-w-full ${maxWidth} min-w-0 ${className}`}>
          {/* Header inteligente */}
          {renderHeader()}

          {/* Contenido con padding bottom condicional */}
          <div className={paddingBottom ? 'pb-16 md:pb-20' : ''}>
            {renderContent()}
          </div>
        </div>

        {/* Panel derecho estilo Twitter - condicional */}
        {showRightPanel && (
          <div className="hidden lg:block lg:w-96 p-4">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Navegación móvil fija abajo */}
      <MobileNavigation />

      {/* Modal universal para crear posts */}
      {isPostModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handlePostModal}
          ></div>
          
          <div className="relative bg-base-100 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-base-300">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h3 className="font-bold text-lg">Crear post</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={handlePostModal}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-0">
              <PostComposer 
                isModal={true}
                onPostCreated={handlePostCreated}
                onClose={handlePostModal}
                placeholder={postModalPlaceholder}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppLayout