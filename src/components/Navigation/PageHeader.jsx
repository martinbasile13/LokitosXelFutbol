import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const PageHeader = ({ 
  title, 
  subtitle = null, 
  showBackButton = true, 
  actions = null,
  className = ""
}) => {
  const navigate = useNavigate()

  return (
    <div className={`sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300 ${className}`}>
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
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-base-content/60">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Acciones opcionales del header */}
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader