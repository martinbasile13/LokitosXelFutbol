// ===========================================
// USERS SERVICES - PUNTO DE ENTRADA PRINCIPAL
// ===========================================
// Este archivo centraliza todas las exportaciones de los servicios de usuarios
// para mantener una API limpia y fácil de importar

// ========== USER PROFILES ==========
export {
  getUserProfile,
  getUserProfileByHandle,
  createUserProfile,
  updateUserProfile,
  updateUserProfileWithAvatar,
  checkUserProfile
} from './usersApi.js'

// ========== USER RELATIONSHIPS ==========
export {
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowers,
  getUserFollowing
} from './usersRelationships.js'

// ========== USER SEARCH ==========
export {
  searchUsers,
  getPopularUsers,
  getUsersByTeam,
  getSuggestedUsers
} from './usersSearch.js'

// ========== USER STATS ==========
export {
  getUserStats,
  getUserActivity,
  getUserRanking
} from './usersStats.js'

// ========== USER MEDIA ==========
export {
  updateCoverImage,
  updateAvatarImage,
  deleteUserMedia,
  deleteUserAvatar,
  deleteUserCoverImage,
  getUserMediaUrls
} from './usersMedia.js'

// ========== USER POSTS ==========
export {
  getUserPosts,
  getUserVideos,
  getUserPostsCount,
  getRecommendedPosts,
  getUserTopPosts
} from './usersPosts.js'