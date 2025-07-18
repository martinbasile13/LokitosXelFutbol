import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getSuggestedUsers, followUser, getUserStats, updateUserProfileWithAvatar } from '../services/userService'
import { validateFile, getReadableFileSize } from '../services/mediaService'
import Avatar from './Avatar'
import { 
  Edit, 
  TrendingUp, 
  UserPlus, 
  Loader2,
  Upload,
  X
} from 'lucide-react'

const RightPanel = () => {
  const { user, userProfile, refreshUserProfile } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [userStats, setUserStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [followingStates, setFollowingStates] = useState({})
  
  // Estados para el modal de edición de perfil
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    username: '',
    team: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const trendingTopics = [
    { topic: '#SeleccionArgentina', posts: '12.5K' },
    { topic: '#Messi', posts: '8.3K' },
    { topic: '#RiverPlate', posts: '5.7K' },
    { topic: '#Boca', posts: '4.9K' },
    { topic: '#Mundial2026', posts: '3.2K' },
  ]

  useEffect(() => {
    if (user?.id) {
      loadSuggestedUsers()
      loadUserStats()
    }
  }, [user])

  const loadSuggestedUsers = async () => {
    try {
      setLoadingUsers(true)
      const users = await getSuggestedUsers(user.id, 3)
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

  const handleFollowUser = async (userToFollowId) => {
    try {
      console.log('Intentando seguir usuario:', userToFollowId, 'desde usuario:', user.id)
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: true }))
      
      const result = await followUser(user.id, userToFollowId)
      console.log('Resultado de followUser:', result)
      
      if (result.success) {
        console.log('Usuario seguido exitosamente, removiendo de la lista')
        // Remover usuario de la lista después de seguirlo
        setSuggestedUsers(prev => prev.filter(u => u.id !== userToFollowId))
        // Actualizar estadísticas
        setUserStats(prev => ({ ...prev, following: prev.following + 1 }))
        // Cargar nuevos usuarios sugeridos
        setTimeout(() => {
          loadSuggestedUsers()
        }, 1000)
      } else {
        console.error('Error en followUser:', result.error)
        setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
        alert('Error al seguir usuario: ' + (result.error?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error siguiendo usuario:', error)
      setFollowingStates(prev => ({ ...prev, [userToFollowId]: false }))
      alert('Error al seguir usuario: ' + error.message)
    }
  }

  const getDisplayName = (profile) => {
    return profile?.username || 'Usuario'
  }

  const getAvatarUrl = (profile) => {
    return profile?.avatar_url || null
  }

  const getTeamBadge = (profile) => {
    const experience = profile?.experience_points || 0
    if (experience > 1000) return '🏆'
    if (experience > 500) return '⚽'
    return '🔰'
  }

  // Funciones para el modal de edición de perfil
  const openEditModal = () => {
    setEditFormData({
      username: userProfile?.username || '',
      team: userProfile?.team || ''
    })
    setAvatarFile(null)
    setAvatarPreview(userProfile?.avatar_url || null)
    setUploadProgress(0)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditFormData({ username: '', team: '' })
    setAvatarFile(null)
    setAvatarPreview(null)
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

  const removeAvatarPreview = () => {
    setAvatarFile(null)
    setAvatarPreview(userProfile?.avatar_url || null)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!editFormData.username.trim()) {
      alert('El nombre de usuario es requerido')
      return
    }

    if (!user?.id) {
      alert('Usuario no autenticado')
      return
    }

    setIsUpdating(true)
    setUploadProgress(0)
    
    try {
      // Simular progreso durante la subida
      if (avatarFile) {
        setUploadProgress(25)
      }

      const result = await updateUserProfileWithAvatar(
        user.id,
        {
          username: editFormData.username.trim(),
          team: editFormData.team.trim(),
          avatar_url: userProfile?.avatar_url // Mantener URL actual si no se sube nueva
        },
        avatarFile // Archivo de avatar (puede ser null)
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
          alert('Perfil actualizado exitosamente')
        }, 500)
        
      } else {
        console.error('Error actualizando perfil:', result.error)
        const errorMsg = result.error?.message || result.error || 'Error desconocido'
        alert('Error al actualizar el perfil: ' + errorMsg)
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      alert('Error al actualizar el perfil: ' + error.message)
    } finally {
      setTimeout(() => {
        setIsUpdating(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  return (
    <div className="p-4 space-y-4">
      
      {/* Perfil del usuario */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-base mb-3">Tu Perfil</h3>
          <div className="flex items-center space-x-3">
            <Avatar 
              src={getAvatarUrl(userProfile) || user?.user_metadata?.avatar_url}
              alt={`Avatar de ${userProfile?.username || 'Usuario'}`}
              name={userProfile?.username || 'Usuario'}
              size="md"
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm">
                {userProfile?.username || user?.user_metadata?.username || 'Usuario'}
              </h4>
              <p className="text-xs text-base-content/70">
                @{userProfile?.username || user?.user_metadata?.username || 'usuario'}
              </p>
              <p className="text-xs mt-1">
                <span className="badge badge-primary badge-xs">
                  {getTeamBadge(userProfile)} {userProfile?.team || 'Sin Equipo'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <div className="font-bold text-sm">{userStats.posts}</div>
              <div className="text-xs text-base-content/70">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-sm">{userStats.followers}</div>
              <div className="text-xs text-base-content/70">Seguidores</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-sm">{userStats.following}</div>
              <div className="text-xs text-base-content/70">Siguiendo</div>
            </div>
          </div>
          
          {/* Botón para editar perfil */}
          <div className="mt-3">
            <button 
              onClick={openEditModal}
              className="btn btn-outline btn-sm w-full hover:scale-105 transition-transform"
            >
              <Edit className="w-4 h-4" />
              Editar perfil
            </button>
          </div>
        </div>
      </div>

      {/* Tendencias */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-base mb-3">Tendencias en fútbol</h3>
          <div className="space-y-2">
            {trendingTopics.map((trend, index) => (
              <div key={index} className="flex justify-between items-center hover:bg-base-300 p-2 rounded cursor-pointer transition-all duration-200 group">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-primary group-hover:text-primary-focus">{trend.topic}</p>
                  <p className="text-xs text-base-content/70">{trend.posts} posts</p>
                </div>
                <TrendingUp className="w-5 h-5 text-success group-hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sugerencias de usuarios - Ahora funcional */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4">
          <h3 className="card-title text-base mb-3">A quién seguir</h3>
          
          {loadingUsers ? (
            <div className="text-center p-4">
              <span className="loading loading-spinner loading-sm"></span>
              <p className="text-xs mt-2">Cargando usuarios...</p>
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-xs text-base-content/70">
                No hay usuarios sugeridos disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar 
                      src={getAvatarUrl(suggestedUser)}
                      alt={`Avatar de ${suggestedUser.username}`}
                      name={suggestedUser.username}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate">
                        {getDisplayName(suggestedUser)}
                      </p>
                      <p className="text-xs text-base-content/70 truncate">
                        @{suggestedUser.username}
                      </p>
                      <p className="text-xs text-primary truncate">
                        {getTeamBadge(suggestedUser)} {suggestedUser.team || 'Sin Equipo'}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-xs hover:scale-105 transition-transform"
                    onClick={() => handleFollowUser(suggestedUser.id)}
                    disabled={followingStates[suggestedUser.id]}
                  >
                    {followingStates[suggestedUser.id] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        Seguir
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de perfil */}
      {showEditModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <form method="dialog" onSubmit={handleUpdateProfile}>
              {/* Botón de cerrar */}
              <button 
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={closeEditModal}
              >
                ✕
              </button>
              
              {/* Título */}
              <h3 className="font-bold text-lg mb-4">Editar Perfil</h3>
              
              {/* Formulario */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre de usuario</span>
                  </label>
                  <input 
                    type="text"
                    className="input input-bordered w-full"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      username: e.target.value
                    }))}
                    placeholder="Ingresa tu nombre de usuario"
                    required
                    disabled={isUpdating}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/70">
                      Tu nombre de usuario será visible para otros usuarios
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Equipo favorito</span>
                  </label>
                  <input 
                    type="text"
                    className="input input-bordered w-full"
                    value={editFormData.team}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      team: e.target.value
                    }))}
                    placeholder="Ej: River Plate, Boca Juniors, Real Madrid..."
                    disabled={isUpdating}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/70">
                      Muestra tu equipo favorito en tu perfil
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Foto de perfil</span>
                  </label>
                  
                  {/* Vista previa del avatar actual o seleccionado */}
                  <div className="flex items-center space-x-4 mb-3">
                    <Avatar 
                      src={avatarPreview}
                      alt="Avatar actual"
                      name={userProfile?.username || 'Usuario'}
                      size="lg"
                    />
                    <div className="flex-1">
                      {avatarFile ? (
                        <div>
                          <p className="text-sm font-medium text-success">
                            📎 {avatarFile.name}
                          </p>
                          <p className="text-xs text-base-content/70">
                            {getReadableFileSize(avatarFile.size)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-base-content/70">
                          {userProfile?.avatar_url ? 'Foto actual' : 'Sin foto de perfil'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Input de archivo */}
                  <div className="flex space-x-2">
                    <label className="btn btn-outline btn-sm flex-1">
                      📷 Seleccionar foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                        disabled={isUpdating}
                      />
                    </label>
                    
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={removeAvatarPreview}
                        className="btn btn-ghost btn-sm"
                        disabled={isUpdating}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <label className="label">
                    <span className="label-text-alt text-base-content/70">
                      Formatos: JPEG, PNG, GIF, WebP. Máximo 5MB
                    </span>
                  </label>
                </div>

                {/* Barra de progreso durante la subida */}
                {isUpdating && avatarFile && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text-alt">Subiendo imagen...</span>
                      <span className="label-text-alt">{uploadProgress}%</span>
                    </label>
                    <progress 
                      className="progress progress-primary w-full" 
                      value={uploadProgress} 
                      max="100"
                    ></progress>
                  </div>
                )}

                {/* Información sobre Storage */}
                <div className="alert alert-info">
                  <span className="text-sm">
                    💡 <strong>Seguro:</strong> Tus imágenes se guardan de forma segura en nuestro servidor. Puedes cambiarla cuando quieras.
                  </span>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUpdating || !editFormData.username.trim()}
                >
                  {isUpdating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={closeEditModal}>
            <button type="button">close</button>
          </form>
        </dialog>
      )}

    </div>
  )
}

export default RightPanel 