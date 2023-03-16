/**
 * order module
 */
export default {
  'views/order/top': () => import('@/views/order/top/top.vue'),
  'views/order/sell': () => import('@/views/order/sell/sell.vue'),
} as const;

