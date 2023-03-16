import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';

export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/channel/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'resource',
    },
  );
}

export function add(data:API.AddChannel) {
  return request(
    {
      url: '/channel/add',
      method: 'post',
      data,
    },
    {
      module: 'resource',
      successMsg: '创建成功',
    },
  );
}

export function edit(data:API.AddChannel) {
  return request(
    {
      url: '/channel/edit',
      method: 'post',
      data,
    },
    {
      module: 'resource',
      successMsg: '修改成功',
    },
  );
}



