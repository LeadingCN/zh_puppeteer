import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';

export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/link/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'resource',
    },
  );
}

export function edit(data:any) {
  return request(
    {
      url: '/link/edit',
      method: 'post',
      data,
    },
    {
      module: 'resource',
      successMsg: '修改成功',
    },
  );
}

