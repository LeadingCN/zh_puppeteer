export const topUsersys = {
  page: 'usersys/top/page',
} as const;
export const values = Object.values(topUsersys);
export type topUsersysPerms = typeof values[number];

export default topUsersys;
