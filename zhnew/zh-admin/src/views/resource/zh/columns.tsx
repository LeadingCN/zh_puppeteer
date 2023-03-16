// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from "@/components/core/dynamic-table";
import { Switch } from "ant-design-vue";
import { formatCurrency } from "@/utils";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
import { edit } from "@/api/resource/zh";
import { getPageList } from "@/api/resource/group";

const userStore = useUserStore(store);
//表格数据字段提示
export type TableListItem = {
  id: number;
  zuid: string;
  accountNumber: string;
  balance: number;
  rechargeLimit: number;
  lockLimit: number;
  totalRecharge: number;
  open: boolean;
  reuse:boolean;
  username: string;
  groupId:string;

  todaySale:number;
  yesterdaySale:number;
  stockLink:number;
  stockLinkAmount:number;
};

export  type TableColumnItem = TableColumn<TableListItem>;
export const baseColumns: TableColumnItem[] = [
  {
    title: "账号",
    align: "center",
    dataIndex: "accountNumber",
    width: 60,
    resizable: true,
    formItemProps: {
      defaultValue: null,
      required: false
    }
  },
  {
    title: "ZUID",
    align: "center",
    dataIndex: "zuid",
    width: 60,
    resizable: true,
    formItemProps: {
      defaultValue: null,
      required: false
    }
  },
  {
    title: "QB余额",
    align: "center",
    dataIndex: "balance",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.balance)}</span>;
    }
  },
  {
    title: "充值限额(元)",
    align: "center",
    dataIndex: "rechargeLimit",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.rechargeLimit)}</span>;
    }
  },
  {
    title: "锁定中额度(元)",
    align: "center",
    dataIndex: "lockLimit",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.lockLimit)}</span>;
    }
  },
  {
    title: "总额(元)",
    align: "center",
    dataIndex: "totalRecharge",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.totalRecharge)}</span>;
    }
  },
  {
    title: "今日 (元)",
    align: "center",
    dataIndex: "todaySale",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.todaySale)}</span>;
    }
  },
  {
    title: "昨日 (元)",
    align: "center",
    dataIndex: "yesterdaySale",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.yesterdaySale)}</span>;
    }
  },
  {
    title: "库存链接",
    align: "center",
    dataIndex: "stockLink",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    }
  },
  {
    title: "库存总额",
    align: "center",
    dataIndex: "stockLinkAmount",
    width: 40,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      //对数值进行 除以100 处理 以显示元 并且小数位 2位
      return <span>{formatCurrency(record.stockLinkAmount)}</span>;
    }
  },
  {
    title: "归属",
    align: "center",
    dataIndex: "username",
    hideInTable: userStore.userInfo.roleLabel == "admin" ? false : true,
    width: 30,
    hideInSearch: userStore.userInfo.roleLabel == "admin" ? false : true,
    formItemProps: {
      defaultValue: null,
      required: false
    },
    customRender: ({ record }) => {
      return <span>{record.username}</span>;
    }
  },
  {
    title: "分组",
    align: "center",
    dataIndex: "groupId",
    hideInTable:true,
    width: 30,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        requestResult: "data",
        request: async () => {
          const { data }: any = await getPageList({ action: "use" });
          return data.map((n) => ({ label: n.name, value: n.id }));
        }
      },
      required: false
    },
    customRender: ({ record }) => {
      return <span>{record.username}</span>;
    }
  },
  {
    title: "开启状态",
    align: "center",
    dataIndex: "open",
    width: 50,
    formItemProps: {
      component: "RadioGroup",
      componentProps: {
        options: [
          {
            label: "开启",
            value: true
          },
          {
            label: "关闭",
            value: false
          }
        ]
      },
      required: false
    },
    customRender: ({ record }) => {
      return <Switch v-model:checked={record.open} onChange={async () => {
        await edit({ action: "open", zuid: record.zuid, open: record.open });
      }
      }></Switch>;
    }
  },
  {
    title: "自动复位",
    align: "center",
    dataIndex: "reuse",
    width: 50,
    formItemProps: {
      component: "RadioGroup",
      componentProps: {
        options: [
          {
            label: "开启",
            value: true
          },
          {
            label: "关闭",
            value: false
          }
        ]
      },
      required: false
    },
    customRender: ({ record }) => {
      return <Switch v-model:checked={record.reuse} onChange={async () => {
        await edit({ action: "reuse", zuid: record.zuid, reuse: record.reuse });
      }
      }></Switch>;
    }
  }
];
