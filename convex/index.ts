// Re-export main public functions for easier imports
export {
  getTrendingTopics,
  searchTopics,
  getTopicBySlug,
  getTopics,
} from "./topics";

export {
  getBlocksByTopic,
} from "./blocks";

export {
  createEmbedding,
  getEmbeddingsByTopic,
  searchSimilarTopics,
  deleteEmbeddingsByTopic,
} from "./embeddings";

export {
  getCategories,
  getCategoryBySlug,
} from "./categories";

export {
  recordInteraction,
} from "./users";

export {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  getNotificationTypes,
} from "./notifications";

