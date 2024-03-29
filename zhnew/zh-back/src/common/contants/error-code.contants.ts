/**
 * 统一错误代码定义
 */
export const ErrorCodeMap = {
  // 10000 - 99999 业务操作错误
  10000: '参数校验异常',
  10001: '系统用户已存在',
  10002: '填写验证码有误',
  10003: '用户名密码有误',
  10004: '节点路由已存在',
  10005: '权限必须包含父节点',
  10006: '非法操作：该节点仅支持目录类型父节点',
  10007: '非法操作：节点类型无法直接转换',
  10008: '该角色存在关联用户，请先删除关联用户',
  10009: '该部门存在关联用户，请先删除关联用户',
  10010: '该部门存在关联角色，请先删除关联角色',
  10015: '该部门存在子部门，请先删除子部门',
  10011: '旧密码与原密码不一致',
  10012: '如想下线自身可右上角退出',
  10013: '不允许下线该用户',
  10014: '父级菜单不存在',
  10016: '系统内置功能不允许操作',
  10017: '用户不存在',
  10018: '无法查找当前用户所属部门',
  10019: '部门不存在',
  10020: '任务不存在',
  10021: '参数配置键值对已存在',
  10101: '不安全的任务，确保执行的加入@Mission注解',
  10102: '所执行的任务不存在',

  // token相关
  11001: '登录无效或无权限访问',
  11002: '登录身份已过期',
  11003: '无权限，请联系管理员申请权限',

  // OSS相关
  20001: '当前创建的文件或目录已存在',
  20002: '无需操作',
  20003: '已超出支持的最大处理数量',
  20004: '文件类型不支持',
  20005: '文件大小超出限制',

  //TODO proxy相关 自己加的
  30001:"不允许添加代理",
  30002:"余额不足,请先充值",
  30003:"充值金额必须为整数",
  30004:"非法操作",
  30005:"下线余额为0",

  //TODO zh相关
  40001:"该账号已存在",
  40002:"编辑出错",
  40003:"该账号不存在",
  40004:"该通道不存在",
  //TODO link相关
  40005:"链接支付中,请勿操作",

  //TODO group相关
  50001:"请选中要添加的账号",
  50002:"删除分组失败,请先删除分组成员",

  //TODO ORDER相关
  60001:"暂停接单",
  60002:"没有该支付通道",
  60003:"校验失败",
  60004:"没有该金额的链接",
  60005:"创建订单失败",
  60006:"没有该订单",
  60007:"订单未超时,请等待",
  60008:"订单已支付成功并且回调成功",
  60009:"订单已强制回调,请勿重复回调",
  60010:"系统配置错误,请联系管理员",
} as const;

export type ErrorCodeMapType = keyof typeof ErrorCodeMap;
