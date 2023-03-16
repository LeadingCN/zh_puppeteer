export const groupResource = {
  page: 'resource/group/page',
  add: 'resource/group/add',
  edit: 'resource/group/edit',
} as const;
export const values = Object.values(groupResource);
export type groupResourcePerms = typeof values[number];

export default groupResource;
