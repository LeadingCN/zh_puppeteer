<template>
  <div>
    <Card title="账号分组管理" style="margin-top: 20px">
      <DynamicTable
        size="small"
        bordered
        :data-request="loadData"
        :columns="columns"
        row-key="id"
        @resize-column="handleResizeColumn"
        :row-selection="rowSelection"
        :pagination="{
          pageSize: 100,
          showSizeChanger: false,
          pageSizeOptions: ['200','300','500']
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
          <a-button type="warning" @click="addGroup()"> 新建分组</a-button>
          <a-button type="primary" danger @click="editGroup('all',[])"> 清空所有分组</a-button>

        </template>
      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Alert, Card, Modal } from "ant-design-vue";
import { baseColumns, type TableColumnItem } from "./columns";
import type { TableListItem } from "./columns";
import { getPageList, edit, add } from "@/api/resource/group";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";

const [DynamicTable, dynamicTableInstance] = useTable();
import { computed, ref } from "vue";
import { useFormModal } from "@/hooks/useModal";

const [showModal] = useFormModal();
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
import { isArray } from "@/utils/is";
import { addSchemas,addAccountSchemas } from "./formSchemas";

const userStore = useUserStore(store);
const addGroup = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `添加账号群组`,
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
const columns: TableColumnItem[] = [
  ...baseColumns,
  {
    title: "操作",
    width: 120,
    dataIndex: "ACTION",
    align: "center",
    fixed: "right",
    // hideInTable: userStore.userInfo.roleLabel != "admin",
    actions: ({ record }) => [
      {
        label: record.children ? "删除群组" : "删除账号",
        onClick: async () => {
          await editGroup("del", record);
        }
      },
      {
        label: record.children ? "添加账号" : "",
        onClick: async () => {
          await addAccount(record.id);
        }
      }
    ]
  }
];
const addAccount = async (groupId:number) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `添加分组成员`,
      width: 500,
      onFinish: async (values) => {
        await edit({action:"addAccount",data:{groupId,...values}})
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: addAccountSchemas,
      autoSubmitOnEnter: true
    }
  });
};
const editGroup = async (action: string, record: any) => {
  let form: any = {
    action
  };


  switch (action) {
    case "del":
      Modal.confirm({
        title: "确定删除?",
        centered: true,
        onOk: async () => {
          await edit({
            action: record.children ? "delGroup" : "delAccount", data: {
              groupId: record.children ? record.id : record.groupId,
              ids: record.children ? [] : record.zuid
            }
          });
          dynamicTableInstance?.reload();
        }
      });
      break;
    case "all":
      Modal.confirm({
        title: "确定要清空?",
        centered: true,
        onOk: async () => {
          await edit({ action: "all" });
          dynamicTableInstance?.reload();
        }
      });
      break;
  }
};

const loadData = async (
  params,
  onChangeParams: OnChangeCallbackParams
): Promise<API.TableListResult> => {
  let { data } = await getPageList(params);
  data.list.forEach(e => {
    e.children.forEach(c => {
      c.name = c.accountNumber;
      c.groupId = e.id;
    });
  });
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
