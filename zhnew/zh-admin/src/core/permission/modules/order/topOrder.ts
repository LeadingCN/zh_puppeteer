export const topOrder = {
  page: 'order/toporder/page',
  callback:"order/toporder/callback"
} as const;
export const values = Object.values(topOrder);
export type topOrderPerms = typeof values[number];

export default topOrder;


