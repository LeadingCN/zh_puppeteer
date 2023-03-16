import type { FormSchema } from "@/components/core/schema-form";
import { getPageList } from "@/api/resource/zh";

export const upRechargeLimitSchemas: FormSchema<any>[] = [
  {
    field: "rechargeLimit",
    component: "InputNumber",
    label: "限额(元)",
    helpMessage: "请输入限额 ",
    rules: [{ required: true, type: "number", pattern: /^[1-9]\d{0,3}$/, message: "请输入1-9999的整数" }]

  },
  {
    field: "zuid",
    vShow: false
  }
];
export const addAccountSchemas: FormSchema<any>[] = [
  {
    field: "ids",
    component: "Select",
    label: "分组账号列表",
    rules: [{ required: true, type: "array" }],
    componentProps: {
      mode: "multiple",
      // labelInValue: true,
      optionFilterProp: "label",//搜索时过滤的属性
      request: async () => {
        const result: any = await getPageList({ action: "createGroup" });
        const data = result.data;
        return data.map((n) => ({ label: n.accountNumber, value: n.zuid }));
      }
    }

  }
];
export const addSchemas: FormSchema<any>[] = [
  {
    field: "name",
    component: "Input",
    label: "分组名称",
    // helpMessage: "请输入限额 ",
    rules: [{ required: true, type: "string" }]
  },
  {
    field: "ids",
    component: "Select",
    label: "分组账号列表",
    rules: [{ required: true, type: "array" }],
    componentProps: {
      mode: "multiple",
      // labelInValue: true,
      optionFilterProp: "label",//搜索时过滤的属性
      request: async () => {
        const result: any = await getPageList({ action: "createGroup" });
        const data = result.data;
        return data.map((n) => ({ label: n.accountNumber, value: n.zuid }));
      }
    }

  }
];
