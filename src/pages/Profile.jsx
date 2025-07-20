import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getUserStats, getUserPosts, updateUserProfileWithAvatar } from '../services/userService'
import { validateFile, getReadableFileSize } from '../services/mediaService'
import { EQUIPOS_PRIMERA } from '../data/equipos'
import Avatar from '../components/Avatar'
import TeamBadge from '../components/TeamBadge'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar,
  MoreHorizontal,
  Edit,
  Loader2,
  Upload,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Profile = () => {
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

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target.result)
    }
    reader.readAsDataURL(file)
    setAvatarFile(file)
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

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setCoverPreview(e.target.result)
    }
    reader.readAsDataURL(file)
    setCoverFile(file)
  }

  const removeAvatarPreview = () => {
    setAvatarFile(null)
    setAvatarPreview(userProfile?.avatar_url || null)
  }

  const removeCoverPreview = () => {
    setCoverFile(null)
    setCoverPreview(userProfile?.cover_image_url || null)
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
      setUploadProgress(25)

      // Simular progreso
      setTimeout(() => setUploadProgress(50), 200)
      
      const result = await updateUserProfileWithAvatar(
        user.id,
        editFormData,
        avatarFile,
        coverFile
      )

      if (avatarFile) {
        setUploadProgress(75)
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
        window.showErrorAlert('Error al actualizar el perfil: ' + errorMsg)
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      window.showErrorAlert('Error al actualizar el perfil: ' + error.message)
    } finally {
      setTimeout(() => {
        setIsUpdating(false)
        setUploadProgress(0)
      }, 500)
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
    <>
      <div className="min-h-screen bg-base-100 flex justify-center">
        {/* Contenedor principal centrado */}
        <div className="flex w-full max-w-7xl">
          {/* Sidebar estilo Twitter - hidden en móvil */}
          <div className="hidden md:block w-20 xl:w-64 border-r border-base-300 sticky top-0 h-screen">
            <Sidebar />
          </div>

          {/* Contenido principal del perfil - responsive */}
          <div className="flex-1 border-r border-base-300 max-w-full md:max-w-[800px] min-w-0">
            {/* Header con navegación */}
            <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-300">
              <div className="flex items-center space-x-4 p-4">
                <button 
                  onClick={() => window.history.back()}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold">{userProfile?.username || 'Usuario'}</h1>
                  <p className="text-sm text-base-content/60">{userStats.posts} posts</p>
                </div>
              </div>
            </div>

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
                    @{userProfile?.username || 'usuario'}
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

                {/* Lado derecho: Website */}
                <div className="flex flex-col items-end space-y-1 ml-4">
                  {/* Website si existe - URL COMPLETA */}
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

              {/* Estadísticas estilo Twitter - NUEVA SECCIÓN */}
              <div className="mt-6 flex items-center space-x-6 py-3 border-t border-base-300">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-lg">{userStats.followers}</span>
                  <span className="text-base-content/70 text-sm">
                    <strong>Seguidores</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-lg">{userStats.following}</span>
                  <span className="text-base-content/70 text-sm">
                    <strong>Siguiendo</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-lg">{userStats.posts}</span>
                  <span className="text-base-content/70 text-sm">
                    <strong>Posts</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Pestañas de navegación */}
            <div className="border-b border-base-300">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-base-content/60 hover:text-base-content'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1">({tab.count})</span>
                    )}
                  </button>
                ))}
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
                        <PostCard key={post.id} post={post} />
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
          </div>

          {/* Panel derecho estilo Twitter - solo visible en pantallas grandes */}
          <div className="hidden lg:block lg:w-96 p-4">
            <RightPanel />
          </div>

          {/* Navegación móvil fija abajo */}
          <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 md:hidden z-50">
            <div className="flex justify-around py-2">
              <Link to="/para-ti" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Inicio</span>
              </Link>
              <Link to="/explorar" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span className="text-xs mt-1">Buscar</span>
              </Link>
              <Link to="/notificaciones" className="flex flex-col items-center p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 17H1l5 5v-5z"/>
                </svg>
                <span className="text-xs mt-1">Notif</span>
              </Link>
              <Link to="/perfil" className="flex flex-col items-center p-2 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span className="text-xs mt-1">Perfil</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición de perfil - Estilo Twitter */}
      {showEditModal && (
        <dialog className="modal modal-open">
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
    </>
  )
}

export default Profile