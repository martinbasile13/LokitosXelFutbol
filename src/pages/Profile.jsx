import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/UI/Avatar'
import TeamBadge from '../components/UI/TeamBadge'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/Navigation/PageHeader'
import { 
  MapPin,
  Calendar,
  MoreHorizontal,
  Edit,
  Loader2,
  Upload,
  X
} from 'lucide-react'
import { getUserStats, getUserPosts, updateUserProfileWithAvatar } from '../services/userService'
import { deletePost } from '../services/posts'
import { validateFile } from '../services/media/fileValidation'
import { EQUIPOS_PRIMERA } from '../data/equipos'
import PostCard from '../components/PostCard/index.jsx'

// Importación lazy del ImageCropper para evitar errores de carga
const LazyImageCropper = ({ showImageCropper, ...props }) => {
  const [ImageCropper, setImageCropper] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (showImageCropper && !ImageCropper && !loading) {
      setLoading(true)
      import('../components/Media/ImageCropper')
        .then(module => {
          setImageCropper(() => module.default)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error cargando ImageCropper:', error)
          setLoading(false)
        })
    }
  }, [showImageCropper, ImageCropper, loading])
  
  if (!showImageCropper || !ImageCropper) return null
  
  return <ImageCropper {...props} isOpen={showImageCropper} />
}

const Profile = () => {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  // Redirigir inmediatamente a /user/handle del usuario actual
  useEffect(() => {
    console.log('🔍 Profile.jsx - Debug de usuario:')
    console.log('user:', user)
    console.log('userProfile:', userProfile)
    console.log('userProfile.handle:', userProfile?.handle)
    
    if (user?.id) {
      // Si tenemos el handle, usarlo directamente
      if (userProfile?.handle) {
        console.log(`✅ Redirigiendo a /user/${userProfile.handle}`)
        navigate(`/user/${userProfile.handle}`, { replace: true })
      } 
      // Si no tenemos handle aún, usar 'me' temporalmente
      else {
        console.log('⚠️ No hay handle, redirigiendo a /user/me')
        navigate(`/user/me`, { replace: true })
      }
    }
  }, [user, userProfile, navigate])

  // Mostrar loading mientras redirige
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-base-content/70">Redirigiendo a tu perfil...</p>
        </div>
      </div>
    </AppLayout>
  )
}

export default Profile