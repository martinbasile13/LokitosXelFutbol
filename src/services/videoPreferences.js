// Utilidad para manejar las preferencias de volumen de video
const VIDEO_VOLUME_KEY = 'videoVolume'
const VIDEO_MUTED_KEY = 'videoMuted'

export const getVideoPreferences = () => {
  const volume = localStorage.getItem(VIDEO_VOLUME_KEY)
  const muted = localStorage.getItem(VIDEO_MUTED_KEY)
  
  return {
    volume: volume !== null ? parseFloat(volume) : 0.5, // Volumen por defecto 50%
    muted: muted !== null ? muted === 'true' : true    // SIEMPRE empezar muteado por defecto
  }
}

export const saveVideoPreferences = (volume, muted) => {
  localStorage.setItem(VIDEO_VOLUME_KEY, volume.toString())
  localStorage.setItem(VIDEO_MUTED_KEY, muted.toString())
  // Comentado: console.log('🔊 Preferencias de video guardadas:', { volume, muted })
}

export const applyVideoPreferences = (videoElement) => {
  if (!videoElement) return
  
  const preferences = getVideoPreferences()
  
  // Aplicar preferencias al video
  videoElement.volume = preferences.volume
  videoElement.muted = preferences.muted
  
  // Comentado: console.log('🎵 Preferencias aplicadas al video:', preferences)
  
  // Escuchar cambios en el volumen para guardar automáticamente
  const handleVolumeChange = () => {
    saveVideoPreferences(videoElement.volume, videoElement.muted)
  }
  
  // Remover listener anterior si existe para evitar duplicados
  videoElement.removeEventListener('volumechange', handleVolumeChange)
  // Agregar nuevo listener
  videoElement.addEventListener('volumechange', handleVolumeChange)
  
  return preferences
}