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
          <a-button type="primary" @click="addTopUser"> 添加商户</a-button>
          <a-button type="warning" @click="editAction('resetpwd',rowSelection.selectedRowKeys)"> 重置所选密码</a-button>
          <a-button v-if="userStore.userInfo.roleLabel=='admin'" type="primary" danger
                    @click="editAction('delete',rowSelection.selectedRowKeys)"> 删除选中
          </a-button>
        </template>

      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Alert, Card, Modal } from "ant-design-vue";
import { baseColumns, type TableColumnItem, type TableListItem } from "./columns";
import { deductionSchemas, rateSchemas, rechargeSchemas } from "./formSchemas";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";
import { getPageList, add, del, edit, proxyDeduction } from "@/api/usersys/proxyuser";
import { computed, ref } from "vue";
import { useFormModal } from "@/hooks/useModal";
import { addSchemas } from "@/views/usersys/top/formSchemas";

import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";

const userStore = useUserStore(store);

const [DynamicTable, dynamicTableInstance] = useTable();
const [showModal] = useFormModal();


const loadData = async (
  params,
  onChangeParams: OnChangeCallbackParams
): Promise<API.TableListResult> => {
  let { data } = await getPageList(params);
  console.log(data);
  if (data.list[0].parent) {
    data.list.forEach(e => {
      e.parentUUID = e.parent.uuid;
    });
  }
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
          // await del({ action: "resetpwd", data: { ids } });
          dynamicTableInstance?.reload();
        }
      });
      break;
    case "delete":
      Modal.confirm({
        title: "确定要删除所选的吗?警告删除该代理会连同删除其代理的所有下线!",
        centered: true,
        onOk: async () => {
          await del({ ids });
          rowSelection.value.selectedRowKeys = [];
          dynamicTableInstance?.reload();
        }
      });
      break;
  }

};
const rate = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `调整费率`,
      width: 500,
      onFinish: async (values) => {
        await edit({ action: "rate", data: values });
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: rateSchemas,
      autoSubmitOnEnter: true
    }
  });
  formRef?.setFieldsValue(record);
};

const recharge = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `充值`,
      width: 500,
      onFinish: async (values) => {
        await edit({ action: "recharge", data: values });
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: rechargeSchemas,
      autoSubmitOnEnter: true
    }
  });
  formRef?.setFieldsValue(record);
};
const deduction = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `扣费`,
      width: 500,
      onFinish: async (values) => {
        await edit({ action: "deduction", data: values });
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: deductionSchemas,
      autoSubmitOnEnter: true
    }
  });
  formRef?.setFieldsValue(record);
};
const proxy_Deduction = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `扣费`,
      width: 500,
      onFinish: async (values) => {
        await proxyDeduction(values);
        dynamicTableInstance?.reload();
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: deductionSchemas,
      autoSubmitOnEnter: true
    }
  });
  formRef?.setFieldsValue(record);
};
const columns: TableColumnItem[] = [
  ...baseColumns,
  {
    title: "操作",
    width: 230,
    dataIndex: "ACTION",
    align: "center",
    fixed: "right",
    actions: ({ record }) => [
      {
        label: "充值",
        type: "primary",
        ifShow: record.parentUUID == userStore.userInfo.uuid || userStore.userInfo.roleLabel == "admin",
        onClick: async () => {
          await recharge(record);
        }
      },
      {
        label: "费率",
        type: "primary",
        ifShow: record.parentUUID == userStore.userInfo.uuid || userStore.userInfo.roleLabel == "admin",
        onClick: async () => {
          await rate(record);
        }
      },
      {
        label: "扣费",
        type: "primary",
        ifShow: userStore.userInfo.roleLabel == "admin",
        onClick: async () => {
          await deduction(record);
        }
      },
      {
        label: "扣费",
        type: "primary",
        ifShow: userStore.userInfo.roleLabel != "admin" &&  Number(userStore.userInfo.lv) <= 2,
        onClick: async () => {
          await proxy_Deduction(record);
        }
      }
    ]
  }
];


</script>

<style lang="less" scoped></style>
