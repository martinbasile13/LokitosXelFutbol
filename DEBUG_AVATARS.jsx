// COMPONENTE TEMPORAL PARA DEBUG
// Agregarlo temporalmente a ParaTi.jsx

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const DEBUG_AVATARS = () => {
  const { user, userProfile } = useAuth()

  useEffect(() => {
    if (userProfile) {
      console.log('=== DEBUG AVATAR URLs ===')
      console.log('1. UserProfile completo:', userProfile)
      console.log('2. Avatar URL:', userProfile.avatar_url)
      console.log('3. Tipo de URL:', typeof userProfile.avatar_url)
      console.log('4. ¿Es string vacío?:', userProfile.avatar_url === '')
      console.log('5. ¿Es null?:', userProfile.avatar_url === null)
      console.log('6. ¿Es undefined?:', userProfile.avatar_url === undefined)
      
      if (userProfile.avatar_url) {
        console.log('7. ¿Contiene supabase?:', userProfile.avatar_url.includes('supabase'))
        console.log('8. ¿Contiene storage?:', userProfile.avatar_url.includes('storage'))
        console.log('9. URL completa:', userProfile.avatar_url)
        
        // Test de carga de imagen
        const testImg = new Image()
        testImg.onload = () => console.log('✅ TEST: Imagen carga OK en JavaScript')
        testImg.onerror = (e) => console.log('❌ TEST: Imagen falla en JavaScript:', e)
        testImg.src = userProfile.avatar_url
      }
      console.log('=========================')
    }
  }, [userProfile])

  return null // No renderiza nada visible
}

export default DEBUG_AVATARS

// INSTRUCCIONES:
// 1. Importar en ParaTi.jsx: import DEBUG_AVATARS from './DEBUG_AVATARS'
// 2. Agregar en el JSX: <DEBUG_AVATARS />
// 3. Recargar la página
// 4. Ver console logs 