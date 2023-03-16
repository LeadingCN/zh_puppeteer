import type { FormSchema } from "@/components/core/schema-form";
// import type { TableListItem } from "@/views/tabledemo/columns";
// import { getUserByKeyWord } from "@/api/wa/account";
//import { getProxyCountryList } from '@/api/wa/proxy';


export const rateSchemas: FormSchema<any>[] = [
  {
    field: "rate",
    component: "Input",
    label: "费率",
    helpMessage: "请输入费率,万分位 100 即 1% ",

    rules: [{ required: true, type: "string",pattern:/^[1-9]\d{0,3}$/,message:"请输入1-9999的整数" }]
  },{
    field: "uuid",
    vShow: false,
  }
];

export const rechargeSchemas: FormSchema<any>[] = [
  {
    field: "amount",
    component: "InputNumber",
    defaultValue:100,
    label: "充值金额(元)",
    // helpMessage: "请输入充值金额 整数",

    rules: [{ required: true, type: "number",pattern:/^[1-9]\d{0,5}$/,message:"请输入1-99999的整数" }]
  },{
    field: "uuid",
    vShow: false,
  }
];

export const deductionSchemas: FormSchema<any>[] = [
  {
    field: "amount",
    component: "InputNumber",
    defaultValue:100,
    label: "金额(元)",
    // helpMessage: "请输入充值金额 整数",

    rules: [{ required: true, type: "number",pattern:/^[1-9]\d{0,5}$/,message:"请输入1-99999的整数" }]
  },{
    field: "uuid",
    vShow: false,
  }
];
