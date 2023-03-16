/**
 * usersys module
 */
export default {
  'views/usersys/proxy': () => import('@/views/usersys/proxy/proxy.vue'),
  'views/usersys/top': () => import('@/views/usersys/top/top.vue'),
  'views/usersys/commission': () => import('@/views/usersys/commission/commission.vue'),
} as const;

