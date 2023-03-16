import type { FormSchema } from "@/components/core/schema-form";
import type { TableListItem } from "@/views/tabledemo/columns";
// import { getUserByKeyWord } from "@/api/wa/account";
//import { getProxyCountryList } from '@/api/wa/proxy';


export const addSchemas: FormSchema<API.AddTopUser>[] = [
  {
    field: "username",
    component: "Input",
    label: "用户名",
    helpMessage: "6-32位",
    rules: [{ required: true, type: "string" }]
  },
  {
    field: "password",
    component: "Input",
    label: "密码",
    helpMessage: "默认123456",
    rules: [{  type: "string" }]
  },
  {
    field: "nickName",
    component: "Input",
    label: "用户昵称",
    helpMessage: "区分",
    rules: [{ required: true,  type: "string" }]
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
