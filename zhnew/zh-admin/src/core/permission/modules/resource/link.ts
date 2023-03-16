export const linkResource = {
  page: 'resource/link/page',
  add: 'resource/link/add',
  edit: 'resource/link/edit',
} as const;
export const values = Object.values(linkResource);
export type linkResourcePerms = typeof values[number];

export default linkResource;
