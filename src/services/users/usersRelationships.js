// ===========================================
// USERS RELATIONSHIPS - SEGUIR/DEJAR DE SEGUIR USUARIOS
// ===========================================
// TODAS LAS FUNCIONES REACTIVADAS PASO A PASO

import { supabase } from '../supabaseClient.js'

/**
 * PASO 5: Seguir a un usuario - REACTIVACIÓN FINAL
 * @param {string} followerId - ID del usuario que quiere seguir
 * @param {string} followedId - ID del usuario a seguir
 * @returns {Promise<Object>} Resultado de la operación
 */
export const followUser = async (followerId, followedId) => {
  try {
    if (!followerId || !followedId) {
      return { success: false, error: 'IDs de usuario requeridos' }
    }

    if (followerId === followedId) {
      return { success: false, error: 'No puedes seguirte a ti mismo' }
    }

    console.log('➕ PASO 5: Probando followUser...', { followerId, followedId })

    // Verificar si ya sigue al usuario
    const alreadyFollowing = await isFollowing(followerId, followedId)
    if (alreadyFollowing) {
      console.log('⚠️ PASO 5: Ya sigue a este usuario')
      return { success: false, error: 'Ya sigues a este usuario' }
    }

    // Insertar nueva relación con timeout
    const result = await Promise.race([
      supabase
        .from('followers')
        .insert({
          follower_id: followerId,
          following_id: followedId
        })
        .select(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en followUser')), 3000)
      )
    ])

    if (result.error) {
      console.error('❌ PASO 5: Error en followUser:', result.error.message)
      return { success: false, error: result.error.message }
    }

    console.log('✅ PASO 5: followUser exitoso')
    return { success: true, data: result.data }

  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.warn('⚠️ PASO 5: Timeout en followUser')
      return { success: false, error: 'Operación demorada, intenta nuevamente' }
    }
    console.error('💥 PASO 5: Error en followUser:', error)
    return { success: false, error: error.message }
  }
}

/**
 * PASO 5: Dejar de seguir a un usuario - REACTIVACIÓN FINAL
 * @param {string} followerId - ID del usuario que quiere dejar de seguir
 * @param {string} followedId - ID del usuario a dejar de seguir
 * @returns {Promise<Object>} Resultado de la operación
 */
export const unfollowUser = async (followerId, followedId) => {
  try {
    if (!followerId || !followedId) {
      return { success: false, error: 'IDs de usuario requeridos' }
    }

    console.log('➖ PASO 5: Probando unfollowUser...', { followerId, followedId })

    // Verificar si realmente sigue al usuario
    const isCurrentlyFollowing = await isFollowing(followerId, followedId)
    if (!isCurrentlyFollowing) {
      console.log('⚠️ PASO 5: No sigue a este usuario')
      return { success: false, error: 'No sigues a este usuario' }
    }

    // Eliminar relación con timeout
    const result = await Promise.race([
      supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followedId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en unfollowUser')), 3000)
      )
    ])

    if (result.error) {
      console.error('❌ PASO 5: Error en unfollowUser:', result.error.message)
      return { success: false, error: result.error.message }
    }

    console.log('✅ PASO 5: unfollowUser exitoso')
    return { success: true }

  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.warn('⚠️ PASO 5: Timeout en unfollowUser')
      return { success: false, error: 'Operación demorada, intenta nuevamente' }
    }
    console.error('💥 PASO 5: Error en unfollowUser:', error)
    return { success: false, error: error.message }
  }
}

/**
 * PASO 1: Verificar si un usuario sigue a otro - REACTIVACIÓN GRADUAL
 * @param {string} followerId - ID del usuario que podría estar siguiendo
 * @param {string} followedId - ID del usuario que podría estar siendo seguido
 * @returns {Promise<boolean>} True si lo sigue, false si no
 */
export const isFollowing = async (followerId, followedId) => {
  try {
    if (!followerId || !followedId) {
      return false
    }

    console.log('🔍 PASO 1: Probando isFollowing con timeout corto...', { followerId, followedId })

    // Usar timeout muy corto para detectar problemas rápidamente
    const result = await Promise.race([
      supabase
        .from('followers')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followedId)
        .maybeSingle(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en isFollowing')), 1000)
      )
    ])

    if (result.error) {
      if (result.error.code === 'PGRST116') {
        // No encontrado - no sigue
        console.log('✅ PASO 1: No sigue (PGRST116)')
        return false
      }
      console.warn('⚠️ PASO 1: Error en isFollowing:', result.error.message)
      return false
    }

    const isFollowingResult = !!result.data
    console.log('✅ PASO 1: isFollowing funcionó:', isFollowingResult)
    return isFollowingResult

  } catch (error) {
    if (error.message === 'Timeout en isFollowing') {
      console.warn('⚠️ PASO 1: Timeout en isFollowing')
    } else {
      console.warn('⚠️ PASO 1: Error en isFollowing:', error.message)
    }
    return false
  }
}

/**
 * PASO 3: Obtener lista de seguidores - REACTIVACIÓN GRADUAL
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Offset para paginación
 * @returns {Promise<Array>} Lista de seguidores
 */
export const getUserFollowers = async (userId, limit = 20, offset = 0) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('👥 PASO 3: Probando getUserFollowers con timeout corto...', { userId, limit, offset })

    // Usar timeout corto para detectar problemas rápidamente
    const result = await Promise.race([
      supabase
        .from('followers')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en getUserFollowers')), 3000)
      )
    ])

    if (result.error) {
      console.warn('⚠️ PASO 3: Error en getUserFollowers:', result.error.message)
      return []
    }

    const simpleFollows = result.data
    if (!simpleFollows || simpleFollows.length === 0) {
      console.log('✅ PASO 3: No hay seguidores')
      return []
    }

    console.log('✅ PASO 3: Obtenidos registros de followers:', simpleFollows.length)

    // Obtener perfiles por separado con timeout
    const followerIds = simpleFollows.map(f => f.follower_id)
    console.log('🔍 PASO 3: Obteniendo perfiles de seguidores...', followerIds)

    const profilesResult = await Promise.race([
      supabase
        .from('profiles')
        .select('id, username, handle, avatar_url, team, experience_points')
        .in('id', followerIds),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en perfiles')), 2000)
      )
    ])

    if (profilesResult.error) {
      console.warn('⚠️ PASO 3: Error obteniendo perfiles:', profilesResult.error.message)
      return []
    }

    const profiles = profilesResult.data || []
    console.log('✅ PASO 3: Perfiles obtenidos:', profiles.length)

    // Combinar datos manualmente
    const followers = simpleFollows.map(follow => {
      const profile = profiles.find(p => p.id === follow.follower_id)
      return {
        ...profile,
        followed_at: follow.created_at
      }
    }).filter(f => f.id)

    console.log('✅ PASO 3: getUserFollowers completado:', followers.length, 'seguidores')
    return followers

  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.warn('⚠️ PASO 3: Timeout en getUserFollowers')
    } else {
      console.error('💥 PASO 3: Error en getUserFollowers:', error)
    }
    return []
  }
}

/**
 * PASO 4: Obtener lista de usuarios seguidos - REACTIVACIÓN GRADUAL
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Offset para paginación
 * @returns {Promise<Array>} Lista de usuarios seguidos
 */
export const getUserFollowing = async (userId, limit = 20, offset = 0) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido')
    }

    console.log('👤 PASO 4: Probando getUserFollowing con timeout corto...', { userId, limit, offset })

    // Usar timeout corto para detectar problemas rápidamente
    const result = await Promise.race([
      supabase
        .from('followers')
        .select('following_id, created_at')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en getUserFollowing')), 3000)
      )
    ])

    if (result.error) {
      console.warn('⚠️ PASO 4: Error en getUserFollowing:', result.error.message)
      return []
    }

    const simpleFollows = result.data
    if (!simpleFollows || simpleFollows.length === 0) {
      console.log('✅ PASO 4: No sigue a nadie')
      return []
    }

    console.log('✅ PASO 4: Obtenidos registros de following:', simpleFollows.length)

    // Obtener perfiles por separado con timeout
    const followingIds = simpleFollows.map(f => f.following_id)
    console.log('🔍 PASO 4: Obteniendo perfiles de seguidos...', followingIds)

    const profilesResult = await Promise.race([
      supabase
        .from('profiles')
        .select('id, username, handle, avatar_url, team, experience_points')
        .in('id', followingIds),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en perfiles')), 2000)
      )
    ])

    if (profilesResult.error) {
      console.warn('⚠️ PASO 4: Error obteniendo perfiles:', profilesResult.error.message)
      return []
    }

    const profiles = profilesResult.data || []
    console.log('✅ PASO 4: Perfiles obtenidos:', profiles.length)

    // Combinar datos manualmente
    const following = simpleFollows.map(follow => {
      const profile = profiles.find(p => p.id === follow.following_id)
      return {
        ...profile,
        followed_at: follow.created_at
      }
    }).filter(f => f.id)

    console.log('✅ PASO 4: getUserFollowing completado:', following.length, 'seguidos')
    return following

  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.warn('⚠️ PASO 4: Timeout en getUserFollowing')
    } else {
      console.error('💥 PASO 4: Error en getUserFollowing:', error)
    }
    return []
  }
}

/**
 * Función de diagnóstico para verificar acceso a tabla followers
 */
export const diagnoseFollowersTable = async (userId) => {
  console.log('🔍 Iniciando diagnóstico de tabla followers...')
  
  const diagnosis = {
    tableExists: false,
    canRead: false,
    canWrite: false,
    policies: 'unknown',
    sampleData: null,
    errors: []
  }

  try {
    // Test 1: Verificar si la tabla existe y se puede leer
    console.log('📋 Test 1: Verificando acceso de lectura...')
    const { data: testRead, error: readError } = await supabase
      .from('followers')
      .select('id')
      .limit(1)

    if (readError) {
      diagnosis.errors.push(`Read Error: ${readError.message} (Code: ${readError.code})`)
      console.error('❌ Error de lectura:', readError)
    } else {
      diagnosis.tableExists = true
      diagnosis.canRead = true
      diagnosis.sampleData = testRead
      console.log('✅ Lectura exitosa, datos:', testRead)
    }

    // Test 2: Verificar si se puede escribir (solo si se puede leer)
    if (diagnosis.canRead && userId) {
      console.log('📝 Test 2: Verificando acceso de escritura...')
      
      // Intentar insertar y eliminar inmediatamente un registro de prueba
      const testRecord = {
        follower_id: userId,
        following_id: userId // Se seguirá a sí mismo temporalmente
      }

      const { data: insertData, error: insertError } = await supabase
        .from('followers')
        .insert(testRecord)
        .select()

      if (insertError) {
        diagnosis.errors.push(`Write Error: ${insertError.message} (Code: ${insertError.code})`)
        console.error('❌ Error de escritura:', insertError)
      } else {
        diagnosis.canWrite = true
        console.log('✅ Escritura exitosa')

        // Limpiar el registro de prueba
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', userId)
      }
    }

    // Test 3: Obtener información de políticas (si es posible)
    console.log('🔒 Test 3: Verificando políticas RLS...')
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'followers' })
        .maybeSingle()

      if (!policiesError && policies) {
        diagnosis.policies = 'detected'
      } else {
        diagnosis.policies = 'not_accessible'
      }
    } catch (policyError) {
      diagnosis.policies = 'check_failed'
      console.log('⚠️ No se pudo verificar políticas (normal en la mayoría de casos)')
    }

  } catch (error) {
    diagnosis.errors.push(`General Error: ${error.message}`)
    console.error('💥 Error general en diagnóstico:', error)
  }

  console.log('📊 Diagnóstico completo:', diagnosis)
  return diagnosis
}

/**
 * Diagnóstico avanzado de políticas RLS para tabla followers
 */
export const diagnoseFollowersRLS = async (userId) => {
  console.log('🔍 DIAGNÓSTICO AVANZADO DE POLÍTICAS RLS - FOLLOWERS')
  console.log('Usuario actual:', userId)
  
  const diagnosis = {
    userId,
    authState: null,
    readTests: [],
    writeTests: [],
    recommendations: []
  }

  try {
    // Test 1: Verificar estado de autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    diagnosis.authState = {
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      authError: authError?.message
    }
    
    console.log('👤 Estado de autenticación:', diagnosis.authState)

    if (!user) {
      diagnosis.recommendations.push('Usuario no autenticado - las políticas RLS requieren autenticación')
      return diagnosis
    }

    // Test 2: Intentar SELECT básico
    console.log('📖 Test SELECT básico...')
    const selectTest = {
      operation: 'SELECT_BASIC',
      success: false,
      error: null,
      details: null
    }

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .limit(1)

      if (error) {
        selectTest.error = `${error.message} (Code: ${error.code})`
        if (error.code === '42501') {
          selectTest.details = 'Error de permisos - políticas RLS bloquean SELECT'
        }
      } else {
        selectTest.success = true
        selectTest.details = `Datos obtenidos: ${data?.length || 0} registros`
      }
    } catch (e) {
      selectTest.error = e.message
    }
    
    diagnosis.readTests.push(selectTest)

    // Test 3: SELECT con filtro de usuario
    console.log('🔍 Test SELECT con filtro de usuario...')
    const selectUserTest = {
      operation: 'SELECT_USER_FILTER',
      success: false,
      error: null,
      details: null
    }

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, following_id')
        .eq('follower_id', userId)
        .limit(5)

      if (error) {
        selectUserTest.error = `${error.message} (Code: ${error.code})`
      } else {
        selectUserTest.success = true
        selectUserTest.details = `Registros de seguimiento del usuario: ${data?.length || 0}`
      }
    } catch (e) {
      selectUserTest.error = e.message
    }
    
    diagnosis.readTests.push(selectUserTest)

    // Test 4: COUNT operation
    console.log('🔢 Test COUNT...')
    const countTest = {
      operation: 'SELECT_COUNT',
      success: false,
      error: null,
      details: null
    }

    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      if (error) {
        countTest.error = `${error.message} (Code: ${error.code})`
        if (error.code === '42501') {
          countTest.details = 'Error de permisos en COUNT - esto es común con políticas RLS mal configuradas'
        }
      } else {
        countTest.success = true
        countTest.details = `Count exitoso: ${count} seguidores`
      }
    } catch (e) {
      countTest.error = e.message
    }
    
    diagnosis.readTests.push(countTest)

    // Test 5: INSERT de prueba
    console.log('✏️ Test INSERT...')
    const insertTest = {
      operation: 'INSERT_TEST',
      success: false,
      error: null,
      details: null
    }

    try {
      // Intentar insertar un registro de prueba (self-follow temporal)
      const { data, error } = await supabase
        .from('followers')
        .insert({
          follower_id: userId,
          following_id: userId // Self-follow temporal para testing
        })
        .select()

      if (error) {
        insertTest.error = `${error.message} (Code: ${error.code})`
        if (error.code === '42501') {
          insertTest.details = 'Error de permisos en INSERT - políticas RLS bloquean inserción'
        } else if (error.code === '23505') {
          insertTest.details = 'Registro ya existe (esto es normal)'
          insertTest.success = true
        }
      } else {
        insertTest.success = true
        insertTest.details = 'INSERT exitoso'
        
        // Limpiar el registro de prueba
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', userId)
      }
    } catch (e) {
      insertTest.error = e.message
    }
    
    diagnosis.writeTests.push(insertTest)

    // Generar recomendaciones basadas en los resultados
    if (!selectTest.success) {
      diagnosis.recommendations.push('❌ SELECT falló - revisar políticas de lectura')
    }
    
    if (!countTest.success) {
      diagnosis.recommendations.push('❌ COUNT falló - las políticas RLS pueden estar bloqueando operaciones de agregación')
    }
    
    if (!insertTest.success) {
      diagnosis.recommendations.push('❌ INSERT falló - revisar políticas de escritura')
    }

    // Recomendaciones específicas para políticas RLS
    diagnosis.recommendations.push('💡 Verificar que las políticas usen auth.uid() en lugar de public role')
    diagnosis.recommendations.push('💡 Eliminar políticas duplicadas que puedan causar conflictos')
    diagnosis.recommendations.push('💡 Asegurar que RLS esté habilitado y configurado correctamente')

  } catch (error) {
    console.error('💥 Error en diagnóstico:', error)
    diagnosis.recommendations.push(`Error general: ${error.message}`)
  }

  console.log('📊 DIAGNÓSTICO COMPLETO:', diagnosis)
  return diagnosis
}