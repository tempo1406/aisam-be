export const POST_CACHE = {
  ALL: 'posts:all',
  BY_USER_ID: (user_id: string) => `posts:user:${user_id}`,
  ONE: (id: string) => `post:${id}`,
};
