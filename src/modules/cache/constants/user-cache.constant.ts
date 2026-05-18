export const USER_CACHE = {
  ALL: 'users:all',
  ONE: (id: string) => `user:${id}`,
  BY_ID: (id: string) => `user:id:${id}`,
  BY_EMAIL: (email: string) => `user:email:${email}`,
};
