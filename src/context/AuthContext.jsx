import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser } from '../services/supabaseClient'
import { getUserProfile } from '../services/userService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Función para obtener el perfil completo del usuario
  const fetchUserProfile = async (userId) => {
    if (!userId) return null
    
    try {
      const profile = await getUserProfile(userId)
      return profile
    } catch (error) {
      console.error('Error obteniendo perfil:', error)
      return null
    }
  }

  useEffect(() => {
    // Timeout de seguridad para Chrome - si no termina en 5s, forzar setLoading(false)
    const emergencyTimeout = setTimeout(() => {
      console.warn('🚨 AuthContext: Emergency timeout - forcing loading = false')
      setLoading(false)
    }, 5000)

    // Obtener usuario inicial
    const getInitialUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        if (currentUser?.id) {
          // Timeout específico para getUserProfile en Chrome
          const profilePromise = fetchUserProfile(currentUser.id)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Chrome timeout')), 3000)
          )
          
          try {
            const profile = await Promise.race([profilePromise, timeoutPromise])
            setUserProfile(profile)
          } catch (error) {
            console.warn('⚠️ Profile fetch timeout, usando perfil básico:', error)
            // Perfil básico si falla
            setUserProfile({
              id: currentUser.id,
              username: 'Usuario',
              avatar_url: null,
              team: null,
              experience_points: 0
            })
          }
        }
      } catch (error) {
        console.error('Error obteniendo usuario inicial:', error)
      } finally {
        clearTimeout(emergencyTimeout)
        setLoading(false)
      }
    }
    
    getInitialUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        try {
          if (session?.user) {
            setUser(session.user)
            
            // Timeout también para el listener en Chrome
            const profilePromise = fetchUserProfile(session.user.id)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Chrome listener timeout')), 3000)
            )
            
            try {
              const profile = await Promise.race([profilePromise, timeoutPromise])
              setUserProfile(profile)
            } catch (error) {
              console.warn('⚠️ Listener profile timeout, usando perfil básico:', error)
              setUserProfile({
                id: session.user.id,
                username: 'Usuario',
                avatar_url: null,
                team: null,
                experience_points: 0
              })
            }
          } else {
            setUser(null)
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Error en auth listener:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    userProfile,
    loading,
    refreshUserProfile: async () => {
      if (user?.id) {
        const profile = await fetchUserProfile(user.id)
        setUserProfile(profile)
        return profile
      }
      return null
    },
    signIn: async (email, password) => {
      try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
      } catch (error) {
        console.error('Error en signIn:', error)
        return { data: null, error }
      }
    },
    signUp: async (email, password, userData) => {
      try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      return { data, error }
      } catch (error) {
        console.error('Error en signUp:', error)
        return { data: null, error }
      }
    },
    signOut: async () => {
      try {
      const { error } = await supabase.auth.signOut()
        if (!error) {
          setUser(null)
          setUserProfile(null)
        }
        return { error }
      } catch (error) {
        console.error('Error en signOut:', error)
      return { error }
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 