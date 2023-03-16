export const proxyUsersys = {
  page: 'usersys/proxy/page',
  del: 'usersys/proxy/del',
  edit: 'usersys/proxy/edit',
  add: 'usersys/proxy/add',
  proxydeduction: 'usersys/proxy/proxydeduction',
} as const;
export const values = Object.values(proxyUsersys);
export type ProxyUsersysPerms = typeof values[number];

export default proxyUsersys;
