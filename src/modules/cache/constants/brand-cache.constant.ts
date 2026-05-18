export const BRAND_CACHE = {
  ALL: 'brands:all',
  BY_USER_ID: (user_id: string) => `brands:user:${user_id}`,
  ONE: (id: string) => `brand:${id}`,
};
