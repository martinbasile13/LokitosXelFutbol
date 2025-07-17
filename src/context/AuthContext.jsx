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
    // Obtener usuario inicial
    const getInitialUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        if (currentUser?.id) {
          const profile = await fetchUserProfile(currentUser.id)
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error obteniendo usuario inicial:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getInitialUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (session?.user) {
          setUser(session.user)
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
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