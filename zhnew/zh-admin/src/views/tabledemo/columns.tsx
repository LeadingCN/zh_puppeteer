// import { debounce } from 'lodash-es';
// import { Tag } from 'ant-design-vue';
import type { TableColumn } from '@/components/core/dynamic-table';
import { Switch } from "ant-design-vue";

//表格数据字段提示
export type TableListItem = {
  open:boolean;
};
export const columns: TableColumn<TableListItem>[] = [
  //例子
  {
    title: "字段标题",
    align: "center",
    dataIndex: "open",//字段属性
    width: 50,
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
      return <Switch v-model:checked={record.open} onChange={()=>{
        console.log(record.open)}
      }></Switch>
    }
  },
]
