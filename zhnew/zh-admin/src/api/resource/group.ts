import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';

export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/group/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'resource',
    },
  );
}
export function add(data:any) {
  return request(
    {
      url: '/group/add',
      method: 'post',
      data,
    },
    {
      module: 'resource',
      successMsg: '导入成功',
    },
  );
}
export function edit(data:any) {
  return request(
    {
      url: '/group/edit',
      method: 'post',
      data,
    },
    {
      module: 'resource',
      successMsg: '修改成功',
    },
  );
}

