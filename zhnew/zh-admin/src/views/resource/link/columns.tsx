// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from "@/components/core/dynamic-table";
import { Modal, Switch, Tag } from "ant-design-vue";

import { formatCurrency } from "@/utils";
import { getPageList as getPageListChannel } from "@/api/resource/channel";
import { getPageList, edit } from "@/api/resource/link";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";

const userStore = useUserStore(store);
//表格数据字段提示
export type TableListItem = {
  id: number;
  zuid: string;
  accountNumber: string;
  amount: number;
  channelName: string;
  oid: string;
  paymentStatus: number;
  reuse: boolean;
  username: string;
  createdAt: Date;
};
const payOptions = [
  {
    label: "支付失败",
    value: -1,
    color: "red"
  },
  {
    label: "等待支付",
    value: 0,
    color: "orange"
  },
  {
    label: "支付成功",
    value: 1,
    color: "green"
  },
  {
    label: "支付中",
    value: 2,
    color: "blue"
  },
  {
    label: "强制回调",
    value: 3,
    color: "purple"
  },
  {
    label: "支付成功强制回调",
    value: 4,
    color: "purple"
  }
];
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
    title: "通道类型",
    align: "center",
    dataIndex: "channelName",
    width: 60,
    resizable: true,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        requestResult: "data",
        request: async () => {
          //请求通道类型
          const { data }: any = await getPageListChannel({ action: "list" });
          return data.map((n) => ({ label: n.name, value: n.id }));
        }
      },
      required: false
    }
  },
  {
    title: "TX订单号",
    align: "center",
    dataIndex: "oid",
    width: 60,
    resizable: true
  },
  {
    title: "金额",
    align: "center",
    dataIndex: "amount",
    width: 60,
    resizable: true,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        requestResult: "data",
        request: async () => {
          //请求通道类型
          const { data }: any = await getPageList({ action: "amountType" });
          return data.map((n) => ({ label: formatCurrency(n.amount), value: n.amount }));
        }
      },
      required: false
    },
    customRender: ({ record }) => {
      return <span>{formatCurrency(record.amount)}</span>;
    }
  },
  {
    title: "支付状态",
    align: "center",
    dataIndex: "paymentStatus",
    width: 60,
    resizable: true,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        options: payOptions
      },
      required: false
    },
    customRender: ({ record }) => {
      return <Tag
        color={payOptions.filter(e => e.value == record.paymentStatus)[0].color}>
        {payOptions.filter(e => e.value == record.paymentStatus)[0].label}
      </Tag>;
    }
  },
  // {
  //   title: "ZUID",
  //   align: "center",
  //   dataIndex: "zuid",
  //   width: 60,
  //   resizable: true,
  //   formItemProps: {
  //     defaultValue: null,
  //     required: false
  //   }
  // },
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
        console.log();
        if(record.reuse){
          Modal.confirm({
            title: "链接开启自动复位,马上更新创建时间和支付状态为可支付,需重新查询",
            centered: true,
            onOk: async () => {
              await edit({ action: "reuse", oid: record.oid, reuse: record.reuse });
            },
            onCancel: () => {
              record.reuse = false;
            }
          })
        }else {
          await edit({ action: "reuse", oid: record.oid, reuse: record.reuse });
        }
      }
      }></Switch>;
    }
  }
  ,{
    title: "创建时间",
    align: "center",
    dataIndex: "createdAt",
    width: 60,
    resizable: true,
  }
];
