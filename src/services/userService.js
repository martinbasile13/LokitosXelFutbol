// ===========================================
// USER SERVICE - PUNTO DE ENTRADA LEGACY (REFACTORIZADO)
// ===========================================
// Este archivo re-exporta funciones de la nueva estructura modular
// para mantener compatibilidad con código existente

// ========== RE-EXPORTAR TODA LA FUNCIONALIDAD DE USERS ==========
export {
  // API básica de usuarios
  getUserProfile,
  getUserProfileByHandle,
  createUserProfile,
  updateUserProfile,
  updateUserProfileWithAvatar,
  checkUserProfile,
  
  // Relaciones entre usuarios
  followUser,
  unfollowUser,
  isFollowing,
  getSuggestedUsers,
  getUserFollowers,
  getUserFollowing,
  
  // Búsqueda de usuarios
  searchUsers,
  getPopularUsers,
  getUsersByTeam,
  
  // Estadísticas de usuarios
  getUserStats,
  getUserActivity,
  getUserRanking,
  
  // Media de usuarios
  updateCoverImage,
  updateAvatarImage,
  deleteUserMedia,
  
  // Posts de usuarios
  getUserPosts,
  getUserVideos,
  getUserPostsCount,
  getRecommendedPosts,
  getUserTopPosts
} from './users'