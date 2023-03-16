// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from "@/components/core/dynamic-table";
import { Switch } from "ant-design-vue";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
const userStore = useUserStore(store);
const SHOW = userStore.userInfo.roleLabel == 'admin' ? false : true
import {formatCurrency} from "@/utils";

import { edit} from "@/api/usersys/proxyuser";
//表格数据字段提示
export type TableListItem = {
  uuid: string;
  username: string;
  nickName: string;
  balance: number;
  yesterdayAmount: number;
  todayAmount: number;
  selfOpen: boolean;
  parentOpen: boolean;
  parentUUID:string;
  parentRate: number;
  rate: number;

};
export type TableColumnItem = TableColumn<TableListItem>;
export const baseColumns: TableColumnItem[] = [

  {
    title: "用户名",
    dataIndex: "username",
    align: "center",
    width: 100
  },
  {
    title: "用户昵称",
    dataIndex: "nickName",
    align: "center",
    width: 100
  },
  {
    title: "uuid",
    dataIndex: "uuid",
    align: "center",
    width: 100
  },
  {
    title: "余额",
    dataIndex: "balance",
    align: "center",
    width: 100,
    hideInSearch: true,
    customRender: ({ record }) => {
      return <span>{formatCurrency(record.balance)}</span>;
    }
  },
  {
    title: "昨日销售",
    dataIndex: "yesterdayAmount",
    align: "center",
    width: 100,
    hideInSearch: true
  },
  {
    title: "今日销售",
    dataIndex: "todayAmount",
    align: "center",
    width: 100,
    hideInSearch: true
  },
  {
    title: "费率",
    dataIndex: "parentRate",
    align: "center",
    width: 70,
    hideInSearch: true,

    customRender: ({ record }) => {
      //鼠标悬浮则显示提示 例子
      return <span title="按订单面值计算 100元 1% 即 1元佣金">{formatCurrency(record.parentRate)+'%'}</span>;
    }
  },
  //例子
  {
    title: "接单状态",
    align: "center",
    dataIndex: "selfOpen",//字段属性
    width: 50,
    hideInSearch: SHOW,
    //表单属性
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
    //自定义渲染
    customRender: ({ record }) => {
      return <Switch v-model:checked={record.selfOpen} disabled onChange={() => {

      }
      }></Switch>;
    }
  },
  {
    title: "允许接单",
    align: "center",
    dataIndex: "parentOpen",//字段属性
    width: 50,
    hideInSearch: SHOW,
    //表单属性
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
    //自定义渲染
    customRender: ({ record }) => {
      return <Switch v-model:checked={record.parentOpen} disabled={userStore.userInfo.uuid != record.parentUUID && userStore.userInfo.uuid != '1'} onChange={async () => {
        await edit({action:"parentOpen",data:{uuid:record.uuid,parentOpen:record.parentOpen}})
      }
      }></Switch>;
    }
  }
];
