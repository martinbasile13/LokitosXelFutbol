import { Link } from 'react-router-dom'

// Componente para renderizar tabs con configuración flexible
export const TabsContainer = ({ tabs, activeTab, onTabChange, className = "" }) => {
  if (!tabs || tabs.length === 0) return null

  return (
    <div className={`flex border-b border-base-300 ${className}`}>
      {tabs.map((tab) => {
        const TabIcon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive
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
  )
}

// Componente para acciones de header reutilizables
export const HeaderActions = ({ actions, className = "" }) => {
  if (!actions || actions.length === 0) return null

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {actions.map((action, index) => (
        <div key={index}>
          {action}
        </div>
      ))}
    </div>
  )
}

// Componente para botones de acción comunes
export const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'ghost',
  size = 'sm',
  loading = false,
  disabled = false,
  className = "",
  ...props 
}) => {
  const baseClasses = `btn btn-${variant} btn-${size} ${className}`
  
  return (
    <button 
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {label && <span className="hidden sm:inline ml-2">{label}</span>}
    </button>
  )
}

// Componente para lista de elementos con estado vacío
export const ContentList = ({ 
  items = [], 
  renderItem, 
  loading = false,
  empty = false,
  emptyConfig = {},
  className = "",
  itemKey = 'id'
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-2 text-base-content/70">Cargando...</p>
        </div>
      </div>
    )
  }

  if (empty || items.length === 0) {
    const { icon = '📭', title = 'Sin contenido', message = 'No hay elementos para mostrar', action } = emptyConfig
    
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-base-content/60 mb-4">{message}</p>
        {action}
      </div>
    )
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={item[itemKey] || index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

// Componente para secciones con header
export const PageSection = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  actions, 
  children,
  className = "",
  headerClassName = "",
  contentClassName = ""
}) => {
  return (
    <section className={`bg-base-200/50 rounded-2xl overflow-hidden border border-base-300 ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`p-4 border-b border-base-300 ${headerClassName}`}>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  {Icon && <Icon className="w-6 h-6 text-primary" />}
                  <span>{title}</span>
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-base-content/60 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </section>
  )
}

// Componente para modales reutilizables
export const PageModal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
  className = ""
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className={`relative bg-base-100 rounded-2xl ${maxWidth} w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-base-300 ${className}`}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h3 className="font-bold text-lg">{title}</h3>
            <button 
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  )
}