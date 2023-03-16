import type { FormSchema } from "@/components/core/schema-form";
import { getPageList } from "@/api/resource/channel";

export const addSchemas: FormSchema<API.AddChannel>[] = [
  {
    field: "parent_id",
    component: "Select",
    componentProps: {
      request: async () => {
        const { data }: any = await getPageList({ action:"use"});
        return data.map((n) => ({ label: n.name, value: n.id }));
      }
    },
    label: "上级支付通道",
    required:false
  },
  {
    field: "name",
    component: "Input",
    label: "支付通道名称",
    rules: [{ required: true, type: "string" }]
  },
  {
    field: "rate",
    component: "InputNumber",
    label: "费率",
    //匹配小数位最多2位数的数字
    helpMessage: "不填则是根支付通道 请输入最多2位数数字,万分制 100 = 1% 8000 = 80%",
    rules: [{ required: false, type: "number",pattern:/[1-9]{0,4}/, message:"请输入最多4位数数字,万分制" }]
  }
];

export const editSchemas: FormSchema<API.AddChannel>[] = [
  {
    field: "id",
    vShow: false,
  },
  {
    field: "name",
    component: "Input",
    label: "支付通道名称",
    rules: [{ required: true, type: "string" }]
  },
  {
    field: "rate",
    component: "Input",
    label: "费率",
    //匹配小数位最多2位数的数字
    helpMessage: "不填则是根支付通道 请输入最多2位数数字,万分制 100 = 1% 8000 = 80%",
    rules: [{ required: false, type: "string",pattern:/[1-9]{0,4}/, message:"请输入最多4位数数字,万分制" }]
  },
  {
    field: "expireTime",
    component: "Input",
    label: "过期时间:秒",
    helpMessage: "单位秒",
    rules: [{ required: false, type: "string",pattern:/[1-9]{0,6}/, message:"请输入最多6位数字" }]
  }
];

export const delSchemas: FormSchema<API.AddChannel>[] = [
  {
    field: "id",
    vShow: false,
  }
]
