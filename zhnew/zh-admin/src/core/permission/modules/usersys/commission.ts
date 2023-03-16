export const commissionUsersys = {
  page: 'usersys/commission/page',
  statistics: 'usersys/commission/statistics',
  edit: 'usersys/commission/edit',
} as const;
export const values = Object.values(commissionUsersys);
export type commissionUsersysPerms = typeof values[number];

export default commissionUsersys;
