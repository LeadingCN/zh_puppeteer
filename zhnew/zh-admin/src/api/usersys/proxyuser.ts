import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';
export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/proxy/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'usersys',
    },
  );
}



export function add(data:API.AddTopUser) {
  return request(
    {
      url: '/proxy/add',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '创建成功',
    },
  );
}

export function del(data:API.ProxyDelete) {
  return request(
    {
      url: '/proxy/del',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '执行成功',
    },
  );
}

export function edit(data:API.EditAction) {
  return request(
    {
      url: '/proxy/edit',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '执行成功',
    },
  );
}

export function proxyDeduction(data:API.EditAction) {
  return request(
    {
      url: '/proxy/proxydeduction',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '执行成功',
    },
  );
}

