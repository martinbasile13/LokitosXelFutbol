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
  const { user, userProfile, refreshUserProfile } = useAuth()
  const [userStats, setUserStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados para el modal de edición de perfil
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    username: '',
    team: '',
    bio: '',
    location: '',
    website: '',
    birth_date: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Estados para el ImageCropper
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [cropperType, setCropperType] = useState('avatar') // 'avatar' o 'cover'
  const [originalImageSrc, setOriginalImageSrc] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadUserStats()
      loadUserPosts()
    }
  }, [user])

  const loadUserStats = async () => {
    try {
      const stats = await getUserStats(user.id)
      setUserStats(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const loadUserPosts = async () => {
    try {
      setLoading(true)
      const userPosts = await getUserPosts(user.id)
      setPosts(userPosts)
    } catch (error) {
      console.error('Error cargando posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funciones para el modal de edición de perfil
  const openEditModal = () => {
    setEditFormData({
      username: userProfile?.username || '',
      team: userProfile?.team || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || '',
      website: userProfile?.website || '',
      birth_date: userProfile?.birth_date || ''
    })
    setAvatarFile(null)
    setAvatarPreview(userProfile?.avatar_url || null)
    setCoverFile(null)
    setCoverPreview(userProfile?.cover_image_url || null)
    setUploadProgress(0)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditFormData({ 
      username: '', 
      team: '', 
      bio: '', 
      location: '', 
      website: '', 
      birth_date: '' 
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setCoverFile(null)
    setCoverPreview(null)
    setUploadProgress(0)
  }

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar archivo
    const validation = validateFile(file, 'image')
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    // Abrir ImageCropper para avatar
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImageSrc(e.target.result)
      setCropperType('avatar')
      setShowImageCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar archivo
    const validation = validateFile(file, 'image')
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    // Abrir ImageCropper para portada
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImageSrc(e.target.result)
      setCropperType('cover')
      setShowImageCropper(true)
    }
    reader.readAsDataURL(file)
  }

  // Manejar el resultado del recorte
  const handleCropComplete = (croppedFile) => {
    if (cropperType === 'avatar') {
      setAvatarFile(croppedFile)
      // Crear preview de la imagen recortada
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(croppedFile)
    } else if (cropperType === 'cover') {
      setCoverFile(croppedFile)
      // Crear preview de la imagen recortada
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverPreview(e.target.result)
      }
      reader.readAsDataURL(croppedFile)
    }
    
    setShowImageCropper(false)
    setOriginalImageSrc(null)
  }

  // Cancelar el recorte
  const handleCropCancel = () => {
    setShowImageCropper(false)
    setOriginalImageSrc(null)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!user?.id) {
      window.showErrorAlert('Debes estar autenticado para actualizar tu perfil')
      return
    }

    if (!editFormData.username.trim()) {
      window.showErrorAlert('El nombre de usuario es requerido')
      return
    }

    if (editFormData.username.length < 3) {
      window.showErrorAlert('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    try {
      setIsUpdating(true)
      setUploadProgress(10)

      // Mostrar progreso específico cuando hay archivos
      if (avatarFile || coverFile) {
        setUploadProgress(20)
        setTimeout(() => setUploadProgress(40), 300)
      } else {
        setUploadProgress(60)
      }
      
      const result = await updateUserProfileWithAvatar(
        user.id,
        editFormData,
        avatarFile,
        coverFile
      )

      if (avatarFile || coverFile) {
        setUploadProgress(80)
      }

      if (result.success) {
        setUploadProgress(100)
        
        // Refrescar el perfil en el contexto
        await refreshUserProfile()
        // Refrescar estadísticas
        await loadUserStats()
        
        setTimeout(() => {
          closeEditModal()
          window.showSuccessAlert('¡Perfil actualizado exitosamente!')
        }, 500)
        
      } else {
        console.error('Error actualizando perfil:', result.error)
        const errorMsg = result.error?.message || result.error || 'Error desconocido'
        
        // Manejar errores específicos de subida de imágenes
        if (errorMsg.includes('imagen de perfil') || errorMsg.includes('imagen de portada')) {
          window.showErrorAlert(`${errorMsg}. Intenta subir las imágenes por separado.`)
        } else {
          window.showErrorAlert('Error al actualizar el perfil: ' + errorMsg)
        }
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      
      // Mensaje más específico para errores de red o servidor
      let errorMessage = 'Error al actualizar el perfil'
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      } else if (avatarFile && coverFile) {
        errorMessage = 'Error subiendo las imágenes. Intenta subir el avatar y la portada por separado.'
      }
      
      window.showErrorAlert(errorMessage)
    } finally {
      setTimeout(() => {
        setIsUpdating(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!user?.id) {
      window.showErrorAlert('Debes estar autenticado para eliminar posts')
      return
    }

    try {
      const result = await deletePost(postId, user.id)
      
      if (result.success) {
        // Remover el post del estado local
        setPosts(prev => prev.filter(post => post.id !== postId))
        // Actualizar las estadísticas
        setUserStats(prev => ({ ...prev, posts: prev.posts - 1 }))
        window.showSuccessAlert('¡Post eliminado exitosamente!')
      } else {
        console.error('Error eliminando post:', result.error)
        window.showErrorAlert('Error al eliminar el post: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error eliminando post:', error)
      window.showErrorAlert('Error al eliminar el post')
    }
  }

  const tabs = [
    { id: 'posts', label: 'Posts', count: userStats.posts },
    { id: 'replies', label: 'Replies' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'articles', label: 'Articles' },
    { id: 'media', label: 'Media' },
    { id: 'likes', label: 'Likes' }
  ]

  return (
    <AppLayout>
      {/* Header simplificado */}
      <PageHeader 
        title={userProfile?.username || 'Usuario'}
        showBackButton
      />

      {/* Header con imagen de fondo */}
      <div className="relative">
        {/* Imagen de fondo del header - "portada" */}
        <div className="h-52 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
          {userProfile?.cover_image_url ? (
            <img 
              src={userProfile.cover_image_url} 
              alt="Imagen de portada" 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Error cargando imagen de portada:', userProfile.cover_image_url);
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40"></div>
          )}
        </div>

        {/* Avatar circular superpuesto - CENTRADO Y MÁS GRANDE */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="w-29 h-29 border-4 border-base-100 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile?.username || 'Usuario'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {(userProfile?.username || 'Usuario').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* XP debajo del avatar */}
          <div className='absolute -bottom-5 left-1/2 transform -translate-x-1/2'>
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white inline-flex items-center justify-center min-w-0">
              <span className="whitespace-nowrap">{userProfile?.experience_points || 0}</span>
              <span className="ml-1 whitespace-nowrap">XP</span>                  
          </div>
          </div>
        </div>

        {/* Botón Editar Perfil */}
        <div className="absolute bottom-4 right-4">
          <button 
            onClick={openEditModal}
            className="btn btn-outline btn-sm rounded-full border-base-100 bg-base-100/80 backdrop-blur-sm hover:bg-base-100 px-4"
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar perfil
          </button>
        </div>
      </div>

      {/* Información del perfil - Layout compacto con flex */}
      <div className="px-4 pt-14 pb-4">
        {/* Contenedor principal con flex */}
        <div className="flex justify-between items-start">
          {/* Lado izquierdo: Info del usuario */}
          <div className="flex-1 min-w-0">
            {/* Nombre del usuario - MÁS GRANDE */}
            <h2 className="text-2xl font-bold text-base-content mb-1">
              {userProfile?.username || 'Usuario'}
            </h2>
            <p className="text-base text-base-content/70 mb-1">
              @{userProfile?.handle || userProfile?.username?.toLowerCase() || 'usuario'}
            </p>
            
            {/* Escudo del equipo - MÁS GRANDE */}
            {userProfile?.team && userProfile.team !== 'Sin Equipo' && (
              <div className="flex items-center space-x-2 mb-2">
                <TeamBadge team={userProfile.team} size="lg" />
                <span className="text-lg font-medium text-primary">
                  {userProfile.team}
                </span>
              </div>
            )}
          </div>

          {/* Lado derecho: Estadísticas de seguimiento */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            {/* Seguidores y Siguiendo */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{userStats.followers}</div>
                <div className="text-base-content/70">Seguidores</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{userStats.following}</div>
                <div className="text-base-content/70">Siguiendo</div>
              </div>
            </div>
            
            {/* Website si existe - Debajo de las estadísticas */}
            {userProfile?.website && (
              <a 
                href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center space-x-1 max-w-40"
              >
                <span>🔗</span>
                <span className="truncate">{userProfile.website}</span>
              </a>
            )}
          </div>
        </div>

        {/* Bio/Descripción - Caja separada */}
        {userProfile?.bio && (
          <div className="mt-4 p-3 bg-base-200 rounded-lg border">
            <p className="text-base-content/90 text-sm leading-relaxed">{userProfile.bio}</p>
          </div>
        )}

        {/* Ubicación y fecha de unión - Compacto */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-base-content/70">
          {userProfile?.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{userProfile.location}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>
              Se unió en {userProfile?.created_at 
                ? new Date(userProfile.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long' 
                  })
                : 'February 2023'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Pestaña única - Solo Posts centrado con contador */}
      <div className="border-b border-base-300">
        <div className="flex justify-center">
          <div className="px-6 py-4 text-sm font-medium border-b-2 border-primary text-primary">
            Posts ({userStats.posts})
          </div>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="pb-16 md:pb-20">
        {activeTab === 'posts' && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-2 text-base-content/70">Cargando posts...</p>
              </div>
            ) : posts.length > 0 ? (
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-bold mb-2">No has publicado nada aún</h3>
                <p className="text-base-content/60 mb-4">
                  Cuando publiques, tus posts aparecerán aquí.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'posts' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">Próximamente</h3>
            <p className="text-base-content/60">
              Esta sección estará disponible pronto.
            </p>
          </div>
        )}
      </div>

      {/* Modal de edición de perfil - Estilo Twitter */}
      {showEditModal && (
        <dialog className="modal modal-open z-[100]">
          <div className="modal-box max-w-xl w-full mx-4 p-0 bg-base-100 rounded-2xl overflow-hidden max-h-[90vh]">
            {/* Header del modal - FIJO */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
              <div className="flex items-center space-x-4">
                <button 
                  type="button"
                  className="btn btn-ghost btn-circle btn-sm"
                  onClick={closeEditModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold">Editar perfil</h3>
              </div>
              <button 
                type="submit"
                form="edit-profile-form"
                className="btn btn-primary btn-sm rounded-full px-6"
                disabled={isUpdating}
              >
                {isUpdating ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <form id="edit-profile-form" onSubmit={handleUpdateProfile}>
                {/* Sección de imágenes - MÁS COMPACTA */}
                <div className="relative">
                  {/* Imagen de portada - MÁS PEQUEÑA */}
                  <div className="h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
                    {coverPreview ? (
                      <img 
                        src={coverPreview} 
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <label className="btn btn-circle btn-sm bg-black/50 hover:bg-black/70 text-white border-none cursor-pointer">
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="hidden"
                          disabled={isUpdating}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Avatar superpuesto - MÁS PEQUEÑO */}
                  <div className="absolute left-4 -bottom-12">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-base-100 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {(editFormData.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Botón para cambiar avatar */}
                      <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xl">📷</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                          disabled={isUpdating}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Formulario - MÁS COMPACTO */}
                <div className="px-4 pt-16 pb-6 space-y-4">
                  {/* Nombre - COMPACTO */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-sm">Nombre</span>
                    </label>
                    <input 
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        username: e.target.value
                      }))}
                      placeholder="Tu nombre de usuario"
                      required
                      disabled={isUpdating}
                      maxLength={50}
                    />
                    <div className="label py-1">
                      <span className="label-text-alt"></span>
                      <span className="label-text-alt text-base-content/60">
                        {editFormData.username.length}/50
                      </span>
                    </div>
                  </div>

                  {/* Bio - COMPACTO */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-sm">Bio</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered textarea-sm w-full h-16 resize-none"
                      value={editFormData.bio || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        bio: e.target.value
                      }))}
                      placeholder="Cuéntanos sobre ti..."
                      maxLength={160}
                      disabled={isUpdating}
                    />
                    <div className="label py-1">
                      <span className="label-text-alt"></span>
                      <span className="label-text-alt text-base-content/60">
                        {(editFormData.bio || '').length}/160
                      </span>
                    </div>
                  </div>

                  {/* Ubicación - COMPACTO */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-sm">Ubicación</span>
                    </label>
                    <input 
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={editFormData.location || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        location: e.target.value
                      }))}
                      placeholder="¿Dónde vives?"
                      maxLength={30}
                      disabled={isUpdating}
                    />
                    <div className="label py-1">
                      <span className="label-text-alt"></span>
                      <span className="label-text-alt text-base-content/60">
                        {(editFormData.location || '').length}/30
                      </span>
                    </div>
                  </div>

                  {/* Sitio web - COMPACTO */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-sm">Sitio web</span>
                    </label>
                    <input 
                      type="url"
                      className="input input-bordered input-sm w-full"
                      value={editFormData.website || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        website: e.target.value
                      }))}
                      placeholder="https://tu-sitio-web.com"
                      disabled={isUpdating}
                    />
                  </div>

                  {/* Equipo favorito - COMPACTO */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-sm">Equipo favorito</span>
                    </label>
                    <select 
                      className="select select-bordered select-sm w-full"
                      value={editFormData.team || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        team: e.target.value
                      }))}
                      disabled={isUpdating}
                    >
                      <option value="">Sin Equipo</option>
                      {EQUIPOS_PRIMERA.map((equipo) => (
                        <option key={equipo.nombre} value={equipo.nombre}>
                          {equipo.nombre}
                        </option>
                      ))}
                    </select>
                    {/* Preview del equipo seleccionado */}
                    {editFormData.team && editFormData.team !== 'Sin Equipo' && (
                      <div className="mt-2 flex items-center space-x-2">
                        <TeamBadge team={editFormData.team} size="sm" />
                        <span className="text-sm text-base-content/70">Vista previa</span>
                      </div>
                    )}
                  </div>

                  {/* Fecha de nacimiento - COMPACTO */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-sm">Fecha de nacimiento</span>
                    </label>
                    <input 
                      type="date"
                      className="input input-bordered input-sm w-full"
                      value={editFormData.birth_date || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        birth_date: e.target.value
                      }))}
                      disabled={isUpdating}
                    />
                    <div className="label py-1">
                      <span className="label-text-alt text-base-content/60 text-xs">
                        Esta información no será pública
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso durante la subida - MÁS COMPACTA */}
                  {isUpdating && (avatarFile || coverFile) && (
                    <div className="bg-base-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Subiendo imagen...</span>
                        <span className="text-sm text-base-content/60">{uploadProgress}%</span>
                      </div>
                      <progress 
                        className="progress progress-primary w-full h-2" 
                        value={uploadProgress} 
                        max="100"
                      ></progress>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
          
          {/* Backdrop */}
          <div 
            className="modal-backdrop bg-black/50" 
            onClick={closeEditModal}
          ></div>
        </dialog>
      )}

      {/* Image Cropper - Editor de imágenes con medidas específicas */}
      <LazyImageCropper
        src={originalImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        type={cropperType}
        showImageCropper={showImageCropper}
      />
    </AppLayout>
  )
}

export default Profile