import Sidebar from './Navigation/Sidebar'
import RightPanel from './RightPanel'
import MobileNavigation from './Navigation/MobileNavigation'

const AppLayout = ({ 
  children, 
  showRightPanel = true, 
  maxWidth = "md:max-w-[800px]",
  className = "" 
}) => {
  return (
    <div className="min-h-screen bg-base-100 flex justify-center">
      {/* Contenedor principal centrado */}
      <div className="flex w-full max-w-7xl">
        {/* Sidebar estilo Twitter - hidden en móvil */}
        <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
          <Sidebar />
        </div>

        {/* Contenido principal - responsive */}
        <div className={`flex-1 border-r border-base-300 max-w-full ${maxWidth} min-w-0 ${className}`}>
          {children}
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
    </div>
  )
}

export default AppLayout