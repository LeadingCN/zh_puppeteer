import type { ProxyUsersysPerms } from "./proxy";
import type { topUsersysPerms } from "./top";
import type { commissionUsersysPerms } from "./commission";

export type ResourcePermissionType =
  | ProxyUsersysPerms
  | topUsersysPerms
  | commissionUsersysPerms;
