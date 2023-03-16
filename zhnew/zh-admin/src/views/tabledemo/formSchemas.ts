import type { FormSchema } from "@/components/core/schema-form";
import type { TableListItem } from "@/views/tabledemo/columns";
// import { getUserByKeyWord } from "@/api/wa/account";
//import { getProxyCountryList } from '@/api/wa/proxy';
declare namespace ProxyApi {
  type CreateProxy = {
    country: string;
    data: string;
  }
}

export const addSchemas: FormSchema<ProxyApi.CreateProxy>[] = [
  {
    field: "country",
    component: "Input",
    label: "国家",
    rules: [{ required: true, type: "string" }]
    // componentProps: {
    //   mode: 'multiple',
    //   request: async () => {
    //     const data = await getProxyCountryList();
    //     return data.map((n) => ({ label: n.name, value: n.id }));
    //   },
    // },
  },
  {
    field: "data",
    component: "InputTextArea",
    label: "增加代理",
    helpMessage: "每次最多1000行,每行一条,每条数据格式 : ip:端口,用户名(可空),密码(可空),代理类别(socks5/http 默认socks5)",
    rules: [{ required: true, type: "string" }]
  }
];
const xxx= async (a)=>{return{data:[a]}}
export const allocSchemas: FormSchema<TableListItem>[] = [
  {
    field: "open",
    component: "Select",
    label: "归属",
    rules: [{ required: true, type: "number" }],
    componentProps: {
      mode: "Select",
      request: async () => {
        const result = await xxx({ action: "search" });
        const data = result.data;
        return data.map((n) => ({ label: n.name, value: n.id }));
      }

    }
  }
];
