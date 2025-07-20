import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getSuggestedUsers, followUser, getUserStats, updateUserProfileWithAvatar } from '../services/userService'
import { validateFile, getReadableFileSize } from '../services/mediaService'
import { EQUIPOS_PRIMERA } from '../data/equipos'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import { 
  Edit, 
  TrendingUp, 
  UserPlus, 
  Loader2,
  Upload,
  X,
  Search
} from 'lucide-react'
import { Link } from 'react-router-dom'

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

  const trends = [
    { topic: '#Boca', posts: '45.2K posts' },
    { topic: '#River', posts: '38.7K posts' },
    { topic: '#PrimeraDivisión', posts: '25.1K posts' },
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
      const users = await getSuggestedUsers(user.id, 2) // Cambiar de 3 a 2 usuarios
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
    <div className="sticky top-0 h-screen overflow-y-auto">
      <div className="p-2 space-y-4">
        
        {/* Barra de búsqueda estilo Twitter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Buscar"
            className="w-full bg-base-200 rounded-full py-3 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-base-100 transition-all duration-200"
            readOnly
          />
        </div>

        {/* Perfil del usuario actual - DISEÑO HORIZONTAL COMO LA IMAGEN */}
        {user && userProfile && (
          <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
            {/* Header azul (placeholder para imagen posterior) */}
            <div className="h-16 bg-primary"></div>
            
            <div className="p-4 -mt-8">
              {/* Layout horizontal: Avatar izquierda, info derecha */}
              <div className="flex items-start space-x-3 mb-3">
                {/* Avatar a la izquierda - CIRCULAR */}
                <div className="w-16 h-16 border-4 border-base-100 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile?.username || 'Usuario'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(userProfile?.username || 'Usuario').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Info en el medio */}
                <div className="flex-1 pt-4">
                  <h3 className="font-bold text-base text-white">{getDisplayName(userProfile)}</h3>
                  <p className="text-base-content/60 text-sm">@{userProfile?.username?.toLowerCase() || 'usuario'}</p>
                </div>

                {/* Badge del equipo A LA IZQUIERDA EN LA MISMA LÍNEA - CENTRADO VERTICALMENTE */}
                {userProfile?.team && (
                  <div className="flex items-center space-x-2 pt-4">
                    <TeamBadge team={userProfile.team} size="md" />
                    <span className="text-xs text-primary font-medium leading-none">
                      {userProfile.team}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Estadísticas en fila horizontal compacta */}
              <div className="flex justify-between text-center">
                <div>
                  <div className="font-bold text-primary text-lg">{userStats.posts}</div>
                  <div className="text-base-content/70 text-xs">Posts</div>
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">{userStats.followers}</div>
                  <div className="text-base-content/70 text-xs">Seguidores</div>
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">{userStats.following}</div>
                  <div className="text-base-content/70 text-xs">Siguiendo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What's happening - Tendencias estilo Twitter - MÁS COMPACTO */}
        <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
          <div className="p-3">
            <h2 className="text-lg font-bold mb-2">Tendencias en fútbol</h2>
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={index} className="cursor-pointer hover:bg-base-200/50 p-1.5 -m-1.5 rounded-lg transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-base-content/60">Tendencia en Argentina</p>
                      <p className="font-bold text-sm text-primary">{trend.topic}</p>
                      <p className="text-xs text-base-content/60">{trend.posts}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-primary hover:underline text-xs pt-1">
                Mostrar más
              </button>
            </div>
          </div>
        </div>

        {/* Who to follow - A quién seguir estilo Twitter - MÁS COMPACTO */}
        <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
          <div className="p-3">
            <h2 className="text-lg font-bold mb-2">A quién seguir</h2>
            <div className="space-y-2">
              {loadingUsers ? (
                <div className="py-2 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
                </div>
              ) : suggestedUsers.length > 0 ? (
                suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center justify-between py-1">
                    <Link 
                      to={`/user/${suggestedUser.id}`}
                      className="flex items-center space-x-2 flex-1 hover:bg-base-300/50 p-1 rounded-lg transition-colors"
                    >
                      <Avatar 
                        src={suggestedUser.avatar_url}
                        alt={suggestedUser.username || 'Usuario'}
                        name={suggestedUser.username || 'Usuario'}
                        team={suggestedUser.team} // Agregar equipo del usuario
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">{suggestedUser.username}</p>
                        <p className="text-xs text-base-content/60 truncate">@{suggestedUser.username?.toLowerCase()}</p>
                        {suggestedUser.team && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-base-content/60">⚽ {suggestedUser.team}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <button 
                      onClick={() => handleFollowUser(suggestedUser.id)}
                      disabled={followingStates[suggestedUser.id]}
                      className="btn btn-xs rounded-full bg-white text-black hover:bg-gray-200 border-gray-300 ml-2 flex-shrink-0"
                    >
                      Seguir
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-base-content/60">
                  <UserPlus className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No hay usuarios sugeridos</p>
                </div>
              )}
              <button className="text-primary hover:underline text-xs pt-1">
                Mostrar más
              </button>
            </div>
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
                    <select 
                      className="select select-bordered w-full"
                      value={editFormData.team || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        team: e.target.value
                      }))}
                      disabled={isUpdating}
                    >
                      <option value="">-- Selecciona tu equipo --</option>
                      {EQUIPOS_PRIMERA.map((equipo) => (
                        <option key={equipo.archivo} value={equipo.nombre}>
                          {equipo.nombre}
                        </option>
                      ))}
                    </select>
                    
                    {/* Vista previa del escudo seleccionado */}
                    {editFormData.team && (
                      <div className="mt-2 flex items-center gap-2">
                        <TeamBadge team={editFormData.team} size="sm" />
                        <span className="text-sm text-base-content/70">
                          Vista previa del escudo
                        </span>
                      </div>
                    )}
                    
                    <label className="label">
                      <span className="label-text-alt text-base-content/70">
                        Selecciona tu equipo de Primera División
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
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Actualizar perfil
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </div>
    </div>
  )
}

export default RightPanel
