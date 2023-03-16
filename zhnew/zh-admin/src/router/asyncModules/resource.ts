/**
 * resource module
 */
export default {
  'views/resource/zh': () => import('@/views/resource/zh/zh.vue'),
  'views/resource/link': () => import('@/views/resource/link/link.vue'),
  'views/resource/group': () => import('@/views/resource/group/group.vue'),
  'views/resource/channel': () => import('@/views/resource/channel/channel.vue')
} as const;
