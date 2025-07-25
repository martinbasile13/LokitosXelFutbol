import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import UserProfileCard from './UserProfileCard'
import SuggestedUsers from './SuggestedUsers'
import SearchBox from '../UI/SearchBox'
import TrendsWidget from './TrendsWidget'
import { getSuggestedUsers, getUserStats } from '../../services/userService'

const RightPanel = () => {
  const { user, userProfile, signOut } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [userStats, setUserStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [loadingUsers, setLoadingUsers] = useState(true)
  
  // Estados para el dropdown del perfil
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      loadSuggestedUsers()
      loadUserStats()
    }
  }, [user])

  const loadSuggestedUsers = async () => {
    try {
      setLoadingUsers(true)
      const users = await getSuggestedUsers(user.id, 2)
      setSuggestedUsers(users)
    } catch (error) {
      console.error('Error cargando usuarios sugeridos:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const stats = await getUserStats(user.id)
      setUserStats(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const confirmed = await window.showConfirm({
      title: '¿Cerrar sesión?',
      message: '¿Estás seguro que quieres cerrar sesión?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      type: 'warning'
    })

    if (confirmed) {
      try {
        const { error } = await signOut()
        if (!error) {
          window.showSuccessAlert('Sesión cerrada exitosamente')
        } else {
          console.error('Error cerrando sesión:', error)
          window.showErrorAlert('Error al cerrar sesión')
        }
      } catch (error) {
        console.error('Error cerrando sesión:', error)
        window.showErrorAlert('Error al cerrar sesión')
      }
    }
  }

  return (
    <div className="sticky top-0 h-screen overflow-y-auto">
      <div className="p-2 space-y-4">
        
        {/* Barra de búsqueda estilo Twitter */}
        <SearchBox />

        {/* Perfil del usuario actual */}
        <UserProfileCard 
          user={user}
          userProfile={userProfile}
          userStats={userStats}
          showProfileDropdown={showProfileDropdown}
          setShowProfileDropdown={setShowProfileDropdown}
          profileDropdownRef={profileDropdownRef}
          onLogout={handleLogout}
        />

        {/* Tendencias de fútbol */}
        <TrendsWidget />

        {/* Usuarios sugeridos */}
        <SuggestedUsers 
          user={user}
          suggestedUsers={suggestedUsers}
          setSuggestedUsers={setSuggestedUsers}
          loadingUsers={loadingUsers}
          userStats={userStats}
          setUserStats={setUserStats}
          onReloadSuggestions={loadSuggestedUsers}
        />
      </div>
    </div>
  )
}

export default RightPanel