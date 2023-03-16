// import { debounce } from 'lodash-es';
import { Tag } from "ant-design-vue";
import type { TableColumn } from "@/components/core/dynamic-table";
//表格数据字段提示
export type TableListItem = {
  id: number;
  name: string;
  children: Array<any>;
};

export  type TableColumnItem = TableColumn<TableListItem>;
export const baseColumns: TableColumnItem[] = [
  {
    title: "分组名称",
    align: "center",
    dataIndex: "name",
    width: 60,
    resizable: true,
    hideInSearch: true,
    formItemProps: {
      defaultValue: null,
      required: false
    }
  },
  {
    title: "分组人数",
    align: "center",
    dataIndex: "count",
    width: 150,
    hideInSearch: true,
    customRender: ({ record }) => {
      // console.log(record);
      return <Tag color="blue">{record.children?record.children.length : ' ' }</Tag>;
    }
  }
];
