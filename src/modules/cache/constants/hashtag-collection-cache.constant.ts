export const HASHTAG_COLLECTION_CACHE = {
  ALL: 'hashtag-collections:all',
  BY_USER_ID: (user_id: string) => `hashtag-collections:user:${user_id}`,
  ONE: (id: string) => `hashtag-collections:${id}`,
};
