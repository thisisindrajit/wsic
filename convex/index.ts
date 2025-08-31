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
  getCategories,
  getCategoryBySlug,
} from "./categories";

export {
  getTags,
  getTagBySlug,
  getTagsByIds,
} from "./tags";

export {
  recordInteraction,
} from "./users";

export {
  createGenerationRequest,
} from "./search";

export {
  getTrendingByPeriod,
} from "./recommendations";

export {
  getUserRewards,
  getUserTotalPoints,
  getRewardLeaderboard,
} from "./rewards";