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
        <template #toolbar>
          <a-button type="primary" @click="addTopUser"> 添加商户</a-button>
          <a-button type="warning" @click="editAction('resetpwd',rowSelection.selectedRowKeys)"> 重置所选密码</a-button>
          <a-button type="primary" danger @click="editAction('delete',rowSelection.selectedRowKeys)"> 删除选中</a-button>
        </template>

      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Alert, Card, Modal } from "ant-design-vue";
import { columns } from "./columns";
import type { TableListItem } from "./columns";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";
import { getPageList, add, edit } from "@/api/usersys/topuser";

const [DynamicTable, dynamicTableInstance] = useTable();
import { computed, ref } from "vue";
import { useFormModal } from "@/hooks/useModal";
import { addSchemas } from "@/views/usersys/top/formSchemas";

const [showModal] = useFormModal();

const loadData = async (
  params,
  onChangeParams: OnChangeCallbackParams
): Promise<API.TableListResult> => {
  let { data } = await getPageList(params);
  return data;
};
const addTopUser = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `添加上游商家`,
      width: 700,
      onFinish: async (values) => {
        await add(values);
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: addSchemas,
      autoSubmitOnEnter: true
    }
  });
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

const editAction = async (type: string, ids: number[]) => {
  switch (type) {
    case "resetpwd":
      Modal.confirm({
        title: "确定要重置所选账号密码?",
        centered: true,
        onOk: async () => {
          await edit({ action: "resetpwd", data: { ids } });
          dynamicTableInstance?.reload();
        }
      });
      break;
    case "delete":
      Modal.confirm({
        title: "确定要删除所选的吗?",
        centered: true,
        onOk: async () => {
          await edit({ action: "delete", data: { ids } });
          dynamicTableInstance?.reload();
        }
      });
      break;
  }

};
</script>

<style lang="less" scoped></style>
