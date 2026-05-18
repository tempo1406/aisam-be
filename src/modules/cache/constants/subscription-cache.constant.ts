export const SUBSCRIPTION_CACHE = {
  ALL: 'subscriptions:all',
  BY_USER_ID: (user_id: string) => `subscriptions:user:${user_id}`,
  ACTIVE_BY_USER_ID: (user_id: string) => `subscription:active:user:${user_id}`,
  ONE: (id: string) => `subscription:${id}`,
};

