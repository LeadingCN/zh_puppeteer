import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';
declare namespace ProxyApi {
  type Add = {
    country:string;
    data:string;
  }
}
export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/zh/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'resource',
    },
  );
}

export function add(data:ProxyApi.Add) {
  return request(
    {
      url: '/zh/add',
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
      url: '/zh/edit',
      method: 'post',
      data,
    },
    {
      module: 'resource',
      successMsg: '修改成功',
    },
  );
}

