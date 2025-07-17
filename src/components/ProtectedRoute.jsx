import { useAuth } from '../context/AuthContext.jsx'
import Auth from '../pages/Auth'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
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