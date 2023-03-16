import type { FormSchema } from "@/components/core/schema-form";

export const upRechargeLimitSchemas: FormSchema<any>[] = [
  {
    field: "rechargeLimit",
    component: "InputNumber",
    label: "限额(元)",
    helpMessage: "请输入限额 ",
    rules: [{ required: true, type: "number",pattern:/^[1-9]\d{0,3}$/,message:"请输入1-9999的整数" }],

  },
  {
    field: "zuid",
    vShow: false,
  }
];
