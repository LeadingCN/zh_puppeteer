import type { zhResourcePerms } from "./zh";
import type { linkResourcePerms } from "./link";
import type { groupResourcePerms } from "./group";
import type { channelResourcePerms } from "./channel";

export type ResourcePermissionType =
  | zhResourcePerms
  | linkResourcePerms
  | groupResourcePerms
  | channelResourcePerms;
