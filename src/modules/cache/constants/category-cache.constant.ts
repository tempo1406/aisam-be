export const CATEGORY_CACHE = {
  ALL: 'categories:all',
  BY_USER_ID: (user_id: string) => `categories:user:${user_id}`,
  ONE: (id: string) => `category:${id}`,
};

