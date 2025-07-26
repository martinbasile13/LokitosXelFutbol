import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { createUserProfile } from '../services/userService'
import { usePageState } from '../components/shared/hooks/usePageState'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()
  
  // Usando el nuevo hook para estados de loading
  const { loading, startLoading, stopLoading } = usePageState()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    startLoading('auth', isLogin ? 'Iniciando sesión...' : 'Creando cuenta...')
    setError('')

    try {
      if (isLogin) {
        // Iniciar sesión
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          setError('Credenciales incorrectas')
          return
        }
      } else {
        // Registro
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden')
          return
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          return
        }

        if (!formData.username.trim()) {
          setError('El nombre de usuario es requerido')
          return
        }

        const { data, error } = await signUp(formData.email, formData.password, {
          username: formData.username,
          full_name: formData.username
        })

        if (error) {
          setError(error.message)
          return
        }

        // Crear perfil en la tabla profiles
        if (data?.user?.id) {
          await createUserProfile(data.user.id, {
            username: formData.username
          })
        }

        alert('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.')
      }
    } catch (error) {
      console.error('Error en autenticación:', error)
      setError('Error en el servidor')
    } finally {
      stopLoading()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100" data-theme="night">
      <div className="max-w-md w-full mx-4">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <img 
                  src="/logo/logo.png" 
                  alt="LokitosXelFutbol" 
                  className="h-50 w-auto"
                />
              </div>
              <p className="text-base-content/70">
                {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
              </p>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed mb-6">
              <button 
                className={`tab flex-1 ${isLogin ? 'tab-active' : ''}`}
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                  setFormData({ email: '', password: '', username: '', confirmPassword: '' })
                }}
              >
                Iniciar Sesión
              </button>
              <button 
                className={`tab flex-1 ${!isLogin ? 'tab-active' : ''}`}
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                  setFormData({ email: '', password: '', username: '', confirmPassword: '' })
                }}
              >
                Registrarse
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username - Solo en registro */}
              {!isLogin && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre de usuario</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="tu_usuario"
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contraseña</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirm Password - Solo en registro */}
              {!isLogin && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirmar contraseña</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="••••••••"
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-6 text-sm text-base-content/70">
              <p>
                Únete a la comunidad futbolera más apasionada 🔥
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth