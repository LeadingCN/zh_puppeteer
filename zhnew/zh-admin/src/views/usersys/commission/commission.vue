<template>
  <div>
    <Card title="账户流水" style="margin-top: 20px">
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
import { Alert, Card } from "ant-design-vue";
import { columns } from "./columns";
import type { TableListItem } from "./columns";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";
import { getPageList } from "@/api/usersys/commission";

const [DynamicTable, dynamicTableInstance] = useTable();
import { computed, ref } from "vue";

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
