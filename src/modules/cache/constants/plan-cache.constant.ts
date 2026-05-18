export const PLAN_CACHE = {
  ALL: 'plans:all',
  ONE: (id: string) => `plan:${id}`,
  BY_NAME: (name: string) => `plan:name:${name}`,
};
