<template>
  <div>
    <Card title="账号管理" style="margin-top: 20px">
      <DynamicTable
        size="small"
        bordered
        :data-request="loadData"
        :columns="columns"
        row-key="zuid"
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
          <!--          <a-button v-if="userStore.userInfo.roleLabel == 'admin'" type="primary" @click="addChannel"> 添加支付通道</a-button>-->
          <a-button type="primary" @click="editZh('open',rowSelection.selectedRowKeys)"> 批量开启接单</a-button>
          <a-button type="primary" @click="editZh('close',rowSelection.selectedRowKeys)"> 批量关闭接单</a-button>
          <a-button type="primary" @click="editZh('upRechargeLimit',rowSelection.selectedRowKeys)"> 批量设置限额
          </a-button>
          <a-button type="primary" @click="editZh('all',[])"> 清空所有账号</a-button>
          <a-button type="primary" danger
                    @click="editZh('del',rowSelection.selectedRowKeys)"> 删除选中
          </a-button>
        </template>
      </DynamicTable>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Alert, Card, Modal } from "ant-design-vue";
import { baseColumns, type TableColumnItem } from "./columns";
import type { TableListItem } from "./columns";
import { getPageList, edit } from "@/api/resource/zh";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";

const [DynamicTable, dynamicTableInstance] = useTable();
import { computed, ref } from "vue";
import { useFormModal } from "@/hooks/useModal";

const [showModal] = useFormModal();

import { isArray } from "@/utils/is";
import { upRechargeLimitSchemas } from "./formSchemas";
import dayjs from "dayjs";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
const userStore = useUserStore(store);
const upRechargeLimit = async (record: Partial<TableListItem> = {}) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `更改限额`,
      width: 500,
      onFinish: async (values) => {
        await edit(Object.assign(values, { action: "upRechargeLimit" }));
        dynamicTableInstance?.reload();

      }
    },
    formProps: {
      labelWidth: 100,
      schemas: upRechargeLimitSchemas,
      autoSubmitOnEnter: true
    }
  });
  let t = JSON.stringify(record);
  let objT = JSON.parse(t);
  objT.rechargeLimit = Number(objT.rechargeLimit) / 100;
  formRef?.setFieldsValue(objT);
};
const upRechargeLimitAll = async (ids: string | string[]) => {
  const [formRef] = await showModal<any>({
    modalProps: {
      title: `更改限额`,
      width: 500,
      onFinish: async (values) => {
        console.log(values);
        await edit(Object.assign(values, { action: "upRechargeLimit", ids }));
        dynamicTableInstance?.reload();
        rowSelection.value.selectedRowKeys = [];
      }
    },
    formProps: {
      labelWidth: 100,
      schemas: upRechargeLimitSchemas,
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
        label: "删除",
        onClick: async () => {
          await editZh("del", record.zuid);
        }
      },
      {
        label: "修改额度",
        onClick: async () => {
          await upRechargeLimit(record);
        }
      }
      ,
      {
        label: "当天限额归0",
        onClick: async () => {
          await edit({action:"resetRechargeLimit",zuid:record.zuid});
          dynamicTableInstance?.reload();
        }
      }
    ]
  }
];
const editZh = async (action: string, zuids: string | string[]) => {
  let form: any = {
    action
  };
  let ids = isArray(zuids) && zuids.length != 0;
  if (ids) {
    if (zuids.length == 0 && action != "all") {
      Modal.error({
        title: "请选择账号",
        centered: true
      });
      return;
    }
  } else {
    if (typeof zuids != "string" && action != "all") {
      Modal.error({
        title: "请选择账号",
        centered: true
      });
      return;
    }
    //单个
    form.zuid = zuids;
  }
  switch (action) {
    case "upRechargeLimit":
      if (ids) await upRechargeLimitAll(zuids);
      break;
    case "del":
      Modal.confirm({
        title: ids ? "确定要批量删除?" : "确定要删除该账号",
        centered: true,
        onOk: async () => {
          await edit(ids ? Object.assign(form, { ids: zuids }) : form);
          dynamicTableInstance?.reload();
          rowSelection.value.selectedRowKeys = [];
        }
      });
      break;
    case "all":
      Modal.confirm({
        title: "确定要清空?",
        centered: true,
        onOk: async () => {
          await edit(form);
          dynamicTableInstance?.reload();
          rowSelection.value.selectedRowKeys = [];
        }
      });
      break;
    case "open":
    case "close":

      Modal.confirm({
        title: action == "close" ? "确定要批量关闭?" : "确定要批量开启?",
        centered: true,
        onOk: async () => {
          await edit(Object.assign(form, { ids: zuids }));
          dynamicTableInstance?.reload();
          rowSelection.value.selectedRowKeys = [];
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
  data.list.forEach((item: any) => {
    item.open = item.open == 1 || item.open == '1' ? true : false;
    item.reuse = item.reuse == 1 || item.reuse == '1' ? true : false;
    item.stockLinkAmount = Number(item.stockLinkAmount)
    item.stockLink = Number(item.stockLink)
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
