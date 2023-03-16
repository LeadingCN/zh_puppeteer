import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';
export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/top/page',
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
      url: '/top/add',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '创建成功',
    },
  );
}

export function edit(data:API.EditAction) {
  return request(
    {
      url: '/top/edit',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '执行成功',
    },
  );
}

