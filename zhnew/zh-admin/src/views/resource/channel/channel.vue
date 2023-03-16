<template>
  <div>
    <Card title="支付通道" style="margin-top: 20px">
      <DynamicTable
        size="small"
        bordered
        :data-request="loadData"
        :columns="columns"
        row-key="id"
        @resize-column="handleResizeColumn"
        :pagination="{
          pageSize: 100,
          showSizeChanger: true,
          pageSizeOptions: ['100','200','300']
        }"
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
          <a-button v-if="userStore.userInfo.roleLabel == 'admin'" type="primary" @click="addChannel"> 添加支付通道
          </a-button>
          <!--          <a-button type="warning" @click="editAction('resetpwd',rowSelection.selectedRowKeys)"> 重置所选密码</a-button>-->
          <!--          <a-button v-if="userStore.userInfo.roleLabel=='admin'" type="primary" danger @click="editAction('delete',rowSelection.selectedRowKeys)"> 删除选中</a-button>-->
        </template>
      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Alert, Card } from "ant-design-vue";
import { getPageList, add, edit } from "@/api/resource/channel";
import { baseColumns, type TableListItem, type TableColumnItem } from "./columns";
import { addSchemas, delSchemas, editSchemas } from "@/views/resource/channel/formSchemas";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";
import { computed, ref } from "vue";

import { useFormModal } from "@/hooks/useModal";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
const userStore = useUserStore(store);
const [DynamicTable, dynamicTableInstance] = useTable();

const [showModal] = useFormModal();
const addChannel = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `添加支付通道`,
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
const editChannel = async (record: Partial<TableListItem> = {}, action: string) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: action == 'edit' ?`更改`:'删除',
      width: 700,
      onFinish: async (values) => {
        await edit(Object.assign(values, { action }));
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: action == 'edit' ? editSchemas : delSchemas,
      autoSubmitOnEnter: true
    }
  });
  formRef?.setFieldsValue(record);
};
const columns: TableColumnItem[] = [
  ...baseColumns,
  {
    title: "操作",
    width: 120,
    dataIndex: "ACTION",
    align: "center",
    fixed: "right",
    hideInTable: userStore.userInfo.roleLabel != "admin",
    actions: ({ record }) => [
      {
        label: "更改",
        type: "primary",
        ifShow: userStore.userInfo.roleLabel == "admin" && record.rate != null,
        onClick: async () => {
          await editChannel(record,'edit');
        }
      },
      {
        label: "删除",
        type: "primary",
        ifShow: userStore.userInfo.roleLabel == "admin" && record.rate != null,
        onClick: async () => {
          await editChannel(record, "del");
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
const handleResizeColumn = (w, col) => {
  // console.log('w', w, col);
  col.width = w;
};
</script>

<style lang="less" scoped></style>
