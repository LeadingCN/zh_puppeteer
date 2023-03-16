<template>
  <div>
    <Card title="链接管理" style="margin-top: 20px">
      <DynamicTable
        size="small"
        bordered
        :data-request="loadData"
        :columns="columns"
        row-key="oid"
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
          <a-button type="primary" @click="editLink('open',rowSelection.selectedRowKeys)"> 批量开启复位</a-button>
          <a-button type="primary" @click="editLink('close',rowSelection.selectedRowKeys)"> 批量关闭复位</a-button>
          <a-button type="warning" @click="editLink('all',[])"> 清空所有链接</a-button>
          <a-button type="primary" danger
                    @click="editLink('del',rowSelection.selectedRowKeys)"> 删除选中
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
import { getPageList, edit } from "@/api/resource/link";
import { useTable, type OnChangeCallbackParams } from "@/components/core/dynamic-table";

const [DynamicTable, dynamicTableInstance] = useTable();
import { computed, ref } from "vue";
import { useFormModal } from "@/hooks/useModal";

const [showModal] = useFormModal();
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
import { isArray } from "@/utils/is";

const userStore = useUserStore(store);


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
          await editLink("del", record.oid);
        }
      }
    ]
  }
];
const editLink = async (action: string, oid: string | string[]) => {
  let form: any = {
    action
  };
  let ids = isArray(oid) && oid.length != 0;
  if (ids) {
    if (oid.length == 0 && action != "all") {
      Modal.error({
        title: "请选择账号",
        centered: true
      });
      return;
    }
  } else {
    if (typeof oid != "string" && action != "all") {
      Modal.error({
        title: "请选择账号",
        centered: true
      });
      return;
    }
    //单个
    form.oid = oid;
  }
  switch (action) {
    case "del":
      Modal.confirm({
        title: ids ? "确定要批量删除?" : "确定要删除该链接",
        centered: true,
        onOk: async () => {
          await edit(ids ? Object.assign(form, { ids: oid }) : form);
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
          await edit(Object.assign(form, { ids: oid }));
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
  data.list.forEach(e=>{
    e.reuse = Boolean(e.reuse);
  })
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
