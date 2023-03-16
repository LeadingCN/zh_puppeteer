// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  StopOutlined
} from "@ant-design/icons-vue";
import type { TableColumn } from "@/components/core/dynamic-table";
import { formatCurrency } from "@/utils";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";

const userStore = useUserStore(store);
const SHOW = userStore.userInfo.roleLabel == "admin" ? false : true;
// import { Switch } from "ant-design-vue";

//表格数据字段提示
export type TableListItem = {
  id: number;
  actionUuid: string;
  orderUuid: string
  event: string;

  typeEnum: string;
  amount: number;
  balance: number;
  createdAt: string;
  uuid: string
  open: boolean;
  username: string

  actionUsername: string
};

const EventObj = {
  "recharge": "充值",
  "rechargeSub": "充值给下级",
  "deduction": "扣款",
  "commission": "佣金",
  "topOrder": "上游订单",
  "topOrderRe": "上游订单取消",
  "orderCallback":"强制回调扣费"
};


export const columns: TableColumn<TableListItem>[] = [
  //例子
  {
    title: "归属",
    align: "center",
    dataIndex: "uuid",//字段属性
    width: 50,
    hideInSearch: SHOW,
    hideInTable: SHOW,
    customRender: ({ record }) => {
      return <span>{record.username && record.username != "" ? record.username : record.uuid}</span>;
    }
  },
  {
    title: "事件发起人",
    align: "center",
    dataIndex: "actionUuid",//字段属性
    width: 50,
    hideInSearch: SHOW,
    hideInTable: SHOW,
    customRender: ({ record }) => {
      return <span>{record.actionUsername ? record.actionUsername : "sys"}</span>;
    }
  },
  {
    title: "订单id",
    align: "center",
    dataIndex: "orderUuid",//字段属性
    width: 50,
    hideInSearch: true,
    customRender: ({ record }) => {
      return <span>{record.orderUuid && record.orderUuid != "" ? record.orderUuid : <StopOutlined />}</span>;
    }
  },
  {
    title: "事件",
    align: "center",
    dataIndex: "event",//字段属性
    width: 50,
    formItemProps: {
      component: "Select",
      componentProps: {
        options: [
          {
            label: "充值",
            value: "recharge"
          },
          {
            label: "扣款",
            value: "deduction"
          },
          {
            label: "佣金",
            value: "commission"
          },
          {
            label: "上游订单",
            value: "topOrder"
          }, {
            label: "上游订单取消",
            value: "topOrderRe"
          }, {
            label: "强制回调扣费",
            value: "orderCallback"
          }
        ]
      },
      required: false

    },
    customRender: ({ record }) => {
      return <span>{EventObj[record.event]}</span>;
    }
  },
  {
    title: "金额",
    align: "center",
    dataIndex: "amount",//字段属性
    width: 50,
    hideInSearch: true,
    customRender: ({ record }) => {
      return record.typeEnum == "add" ? <span style={{
          color: "red"
        }}><ArrowUpOutlined /> {formatCurrency(record.amount)}</span> :
        <span style={{
          color: "green"
        }}><ArrowDownOutlined /> {formatCurrency(record.amount)}</span>;

    }
  },
  {
    title: "余额",
    align: "center",
    dataIndex: "balance",//字段属性
    width: 50,
    hideInSearch: true,
    customRender: ({ record }) => {
      return <span>{formatCurrency(record.balance)} </span>;
    }
  },
  {
    title: "时间",
    align: "center",
    dataIndex: "createdAt",//字段属性
    width: 50,
    formItemProps: {
      component: "RangePicker",
      required: false
    }
  }
];
