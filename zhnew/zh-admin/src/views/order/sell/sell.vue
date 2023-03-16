<template>
  <div>
    <Card title="账号管理" style="margin-top: 20px">
      <DynamicTable
        size="small"
        bordered
        :data-request="loadData"
        :columns="columns"
        row-key="id"
        @resize-column="handleResizeColumn"
        :row-selection="rowSelection"
      >
        <template v-if="isCheckRows" #title>
          <Alert class="w-full" type="info" show-icon>
            <template #message>
              已选 {{ isCheckRows }} 项
              <a-button type="link" @click="rowSelection.selectedRowKeys = []">取消选择</a-button>
            </template>
          </Alert>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            {{ record.name }} <a class="text-red-500">[测试bodyCell]</a>
          </template>
        </template>
      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
  import {Alert, Card } from 'ant-design-vue';
  import { columns } from './columns';
  import type { TableListItem } from "./columns"
  import { useTable, type OnChangeCallbackParams } from '@/components/core/dynamic-table';

  const [DynamicTable, dynamicTableInstance] = useTable();
  import { computed, ref } from "vue";
  const loadData = async (
    params,
    onChangeParams: OnChangeCallbackParams,
  ): Promise<API.TableListResult> => {
   return []
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
