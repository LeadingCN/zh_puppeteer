import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';

export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/toporder/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'order',
    },
  );
}
export function callback(data:any) {
  return request(
    {
      url: '/toporder/callback',
      method: 'post',
      data,
    },
    {
      module: 'order',
      successMsg: '强制回调成功',
    },
  );
}
