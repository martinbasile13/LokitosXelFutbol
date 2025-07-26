// ===========================================
// POSTS SERVICES - PUNTO DE ENTRADA PRINCIPAL
// ===========================================
// Este archivo centraliza todas las exportaciones de los servicios de posts
// para mantener una API limpia y fácil de importar

// ========== POSTS CRUD ==========
export {
  createPost,
  deletePost,
  getPostById,
  updatePost
} from './postsApi.js'

// ========== POSTS FEED ==========
export {
  getFeedPosts,
  getUserPosts,
  getPostsWithUserData
} from './postsFeed.js'

// ========== POSTS INTERACTIONS ==========
export {
  likePost,
  dislikePost,
  addPostView,
  getPostInteractions,
  getUserPostVote
} from './postsInteractions.js'

// ========== POSTS REPLIES (COMENTARIOS COMO POSTS) ==========
export {
  createReply,
  getPostReplies,
  getPostThread,
  getPostRepliesCount,
  deleteReply
} from './postsReplies.js'

// ========== COMMENTS (SISTEMA LEGACY) ==========
export {
  getCommentsTree,
  createComment,
  deleteComment,
  likeComment,
  dislikeComment,
  getUserCommentVote
} from './commentsApi.js'

// ========== VIDEOS ==========
export {
  getVideoFeed,
  getVideoById,
  getVideosByUser
} from './videosApi.js'