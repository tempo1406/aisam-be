export const SOCIAL_CACHE = {
  ALL: 'social:all',
  BY_USER_ID: (user_id: string) => `social:user:${user_id}`,
  ONE: (id: string) => `social:${id}`,
};
