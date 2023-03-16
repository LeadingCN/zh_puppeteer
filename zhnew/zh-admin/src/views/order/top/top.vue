<template>
  <div>
    <Card title="订单查询" style="margin-top: 20px">
      <DynamicTable
        size="small"
        bordered
        :data-request="loadData"
        :columns="columns"
        row-key="id"
        @resize-column="handleResizeColumn"
      >


      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Alert, Card, Modal } from "ant-design-vue";
import { baseColumns, type TableColumnItem } from "./columns";
import type { TableListItem } from "./columns";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";

const [DynamicTable, dynamicTableInstance] = useTable();
import { computed, ref } from "vue";
import { getPageList, callback } from "@/api/order/toporder";
import { store } from "@/store";
import { useUserStore } from "@/store/modules/user";
import { edit } from "@/api/resource/group";

const userStore = useUserStore(store);

const columns: TableColumnItem[] = [
  ...baseColumns,
  {
    title: "操作",
    width: 120,
    dataIndex: "ACTION",
    align: "center",
    fixed: "right",
    hideInTable: userStore.userInfo.roleLabel == "top",
    actions: ({ record }) => [
      {
        label: "强制回调",
        ifShow: userStore.userInfo.roleLabel != "top",
        onClick: async () => {
          console.log(record);
          Modal.confirm({
            title: "确定回调吗?",
            centered: true,
            onOk: async () => {
              await callback({oid:record.oid});
              dynamicTableInstance?.reload();
            }
          })

        }
      }
    ]
  }
];

const loadData = async (
  params,
  onChangeParams: OnChangeCallbackParams
): Promise<API.TableListResult> => {
  let { data } = await getPageList(params);
  return data;
};

const handleResizeColumn = (w, col) => {
  // console.log('w', w, col);
  col.width = w;
};
/*
* 多选方法
* */
const rowSelection = ref({
  selectedRowKeys: [] as number[],
  onChange: (selectedRowKeys: number[], selectedRows: TableListItem[]) => {
    //console.log(`selectedRowKeys: ${selectedRowKeys}`, "selectedRows: ", selectedRows);
    rowSelection.value.selectedRowKeys = selectedRowKeys;
  }
});
const isCheckRows = computed(() => rowSelection.value.selectedRowKeys.length);
</script>

<style lang="less" scoped></style>
