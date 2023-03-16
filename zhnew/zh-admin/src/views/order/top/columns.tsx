// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from '@/components/core/dynamic-table';
// import { Switch } from "ant-design-vue";
import { formatCurrency } from "@/utils";
import { Tag } from "ant-design-vue";
import { getPageList as getPageListChannel } from "@/api/resource/channel";
import { store } from "@/store";
import { useUserStore } from "@/store/modules/user";
const userStore = useUserStore(store);
//表格数据字段提示
export type TableListItem = {
  mid: number;
  mOid:string;
  oid:string;
  lOid:string;
  accountNumber:string;
  amount:number;
  createdAt:Date;
  callback:number;
  channelName:string;
  status:number;


};
const payOptions=[
  {
    label: "支付超时",
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
]
// 0 等待支付回调  1回调成功 2回调失败 3强制回调
const callbackOptions= [
  {
    label: "回调失败",
    value: 2,
    color: "orange"
  },
  {
    label: "等待支付回调",
    value: 0,
    color: "orange"
  },
  {
    label: "回调成功",
    value: 1,
    color: "green"
  },
  {
    label: "强制回调",
    value: 3,
    color: "purple"
  }
]

export  type TableColumnItem = TableColumn<TableListItem>;
export const baseColumns: TableColumn<TableListItem>[] = [
  //例子
  {
    title: "商户号",
    align: "center",
    dataIndex: "mid",//字段属性
    hideInSearch: userStore.userInfo.roleLabel != 'admin',//是否隐藏搜索
    hideInTable: userStore.userInfo.roleLabel != 'admin',//是否隐藏表格
    width: 20,
  },
  {
    title: "支付商订单号",
    align: "center",
    hideInSearch: userStore.userInfo.roleLabel == 'proxy',//是否隐藏搜索
    dataIndex: "mOid",//字段属性
    width: 50,
  },
  {
    title: "系统订单号",
    align: "center",
    dataIndex: "oid",//字段属性
    width: 50,
  },
  {
    title: "链接订单号",
    align: "center",
    dataIndex: "lOid",//字段属性
    width: 50,
  },
  {
    title: "归属ZH",
    align: "center",
    dataIndex: "accountNumber",//字段属性
    hideInSearch: userStore.userInfo.roleLabel == 'top',//是否隐藏搜索
    hideInTable: userStore.userInfo.roleLabel == 'top',//是否隐藏表格
    width: 50,
  },
  {
    title: "金额",
    align: "center",
    dataIndex: "amount",//字段属性
    width: 50,
    customRender: ({ record }) => {
      return <span>{formatCurrency(record.amount)}</span>;
    }
  },
  {
    title: "创建时间",
    align: "center",
    dataIndex: "createdAt",//字段属性
    width: 50,
    formItemProps: {
      component: "RangePicker",
      required: false
    }
  },{
    title: "通道名称",
    align: "center",
    dataIndex: "channelName",//字段属性
    width: 50,
    resizable: true,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        requestResult: "data",
        request: async () => {
          //请求通道类型
          if(userStore.userInfo.roleLabel == 'top'){
            const { data }: any = await getPageListChannel({ action: "use" });
            return data.map((n) => ({ label: n.name, value: n.id }));
          }else {
            const { data }: any = await getPageListChannel({ action: "list" });
            return data.map((n) => ({ label: n.name, value: n.id }));
          }

        }
      },
      required: false
    }
  },{
    title: "回调状态",
    align: "center",
    dataIndex: "callback",//字段属性
    width: 50,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        options: callbackOptions
      },
      required: false
    },
    customRender: ({ record }) => {
      return <Tag
        color={callbackOptions.filter(e => e.value == record.callback)[0].color}>
        {callbackOptions.filter(e => e.value == record.callback)[0].label}
      </Tag>;
    }
  },
  {
    title: "状态",
    align: "center",
    dataIndex: "status",//字段属性
    width: 50,
    formItemProps: {
      component: "Select",
      defaultValue: null,
      componentProps: {
        options:payOptions
      },
      required: false
    },
    customRender: ({ record }) => {
      return <Tag
        color={payOptions.filter(e => e.value == record.status)[0].color}>
        {payOptions.filter(e => e.value == record.status)[0].label}
      </Tag>;
    }
  }

]
