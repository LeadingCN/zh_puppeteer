export const zhResource = {
  page: 'resource/zh/page',
  add: 'resource/zh/add',
  del: 'resource/zh/del',
  edit: 'resource/zh/edit',
} as const;
export const values = Object.values(zhResource);
export type zhResourcePerms = typeof values[number];

export default zhResource;
