import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import Auth from '../pages/Auth'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const [emergencyBypass, setEmergencyBypass] = useState(false)

  // Timeout SOLO para Chrome: si loading dura más de 8s, mostrar bypass
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('🚨 Chrome loading timeout - activando bypass')
        setEmergencyBypass(true)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [loading])

  // Si loading + emergencyBypass, mostrar botón manual
  if (loading && emergencyBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Cargando...</p>
          <div className="mt-4">
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Recargar (Chrome fix)
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading && !emergencyBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return children
}

export default ProtectedRoute 