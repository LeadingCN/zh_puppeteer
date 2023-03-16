import type { BaseResponse } from '@/utils/request';
import { request } from '@/utils/request';
export function getPageList(query: API.PageParams) {
  return request<BaseResponse<API.TableListResult>>(
    {
      url: '/commission/page',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'usersys',
    },
  );
}
export function getStatistics(query: any) {
  return request<BaseResponse<any>>(
    {
      url: '/commission/statistics',
      method: 'get',
      params: query,
    },
    {
      isGetDataDirectly: false,
      module: 'usersys',
    },
  );
}

export function setOpenStatus(data:any) {
  return request(
    {
      url: '/commission/edit',
      method: 'post',
      data,
    },
    {
      module: 'usersys',
      successMsg: '执行成功',
    },
  );
}


