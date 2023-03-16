export const channelResource = {
  page: 'resource/channel/page',
  add: 'resource/channel/add',
  del: 'resource/channel/del',
  edit: 'resource/channel/edit',
} as const;
export const values = Object.values(channelResource);
export type channelResourcePerms = typeof values[number];

export default channelResource;
