// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from '@/components/core/dynamic-table';
// import { Switch } from "ant-design-vue";

//表格数据字段提示
export type TableListItem = {
id: number;
  name: string;
  username: string;
  nickName: string;
  uuid: string;
  md5key: string;
  open:boolean;
  createdAt: string;
};
export const columns: TableColumn<TableListItem>[] = [
  //例子
  // {
  //   title: "字段标题",
  //   align: "center",
  //   dataIndex: "open",//字段属性
  //   width: 50,
  //   //表单属性
  //   formItemProps: {
  //     component: "RadioGroup",
  //     componentProps: {
  //       options: [
  //         {
  //           label: "开启",
  //           value: true
  //         },
  //         {
  //           label: "关闭",
  //           value: false
  //         }
  //       ]
  //     },
  //     required: false
  //   },
  //   //自定义渲染
  //   customRender: ({ record }) => {
  //     return <Switch v-model:checked={record.open} onChange={()=>{
  //       console.log(record.open)}
  //     }></Switch>
  //   }
  // },
  {
    title: "商户号",
    align: "center",
    dataIndex: "id",//字段属性
    width: 20,
    //表单属性
    hideInSearch: true,
  },
  {
    title: "商户昵称",
    align: "center",
    dataIndex: "nickName",//字段属性
    width: 50,
  },
  {
    title: "商户用户名",
    align: "center",
    dataIndex: "username",//字段属性
    width: 50,
  },
  {
    title: "md5密钥",
    align: "center",
    dataIndex: "md5key",//字段属性
    width: 50,
    hideInSearch: true,
  },
  {
    title: "创建时间",
    align: "center",
    dataIndex: "createdAt",//字段属性
    width: 50,
    hideInSearch: true,
  }
]
