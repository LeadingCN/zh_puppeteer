// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from "@/components/core/dynamic-table";
import { formatCurrency } from "@/utils";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";

const userStore = useUserStore(store);
//表格数据字段提示
export type TableListItem = {
  id: number;

  name: string;

  rate: string;

  expireTime: string;

};
export  type TableColumnItem = TableColumn<TableListItem>;
export const baseColumns: TableColumnItem[] = [
  //例子
  {
    title: "名称",
    align: "center",
    dataIndex: "name",//字段属性
    width: 50,
    //表单属性
    hideInSearch: true
    // //自定义渲染
    // customRender: ({ record }) => {
    //   return <Switch v-model:checked={record.open} onChange={()=>{
    //     console.log(record.open)}
    //   }></Switch>
    // }
  },
  {
    title: "费率",
    align: "center",
    dataIndex: "rate",//字段属性
    width: 50,
    //表单属性
    hideInSearch: true,
    // //自定义渲染
    customRender: ({ record }) => {
      if (record.rate) {
        //格式化
        return <span>{formatCurrency(record.rate)}%</span>;
      }

    }
  },
  {
    title: "链接过期时间:秒",
    align: "center",
    dataIndex: "expireTime",//字段属性
    width: 50,
    //表单属性
    hideInSearch: true,
    hideInTable: userStore.userInfo.roleLabel != "admin"//判断是否admin
    // //自定义渲染
    // customRender: ({ record }) => {
    //   if(record.rate){
    //     //格式化
    //     return <span>{formatCurrency(record.rate)}%</span>
    //   }
    //
    // }
  }
];
