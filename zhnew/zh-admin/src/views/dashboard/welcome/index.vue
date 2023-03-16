<template>
  <div class="box">
    <Descriptions title="账户统计" bordered v-if="userStore.userInfo.roleLabel != 'top'">
      <Descriptions.Item key="balance" label="账户余额" :span="2">
        {{ balance }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="接单开关">
        <Switch v-model:checked="open" @change="setOpen"></Switch>
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="今日销售总额" :span="2">
        {{ formatCurrency(todaySale) }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="今日上游订单总数">
        {{ todayOrder }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="昨日销售总额" :span="2">
        {{ formatCurrency(yesterdaySale) }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="昨日上游订单总数">
        {{ yesterdayOrder }}
      </Descriptions.Item>

      <Descriptions.Item key="balance" label="ZH总数">
        {{ ZHCount }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="库存链接">
        {{ stockLink }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="可用链接">
        {{ availableLink }}
      </Descriptions.Item>
      <Descriptions.Item v-for="(value, key) in linkArr" :key="key" :label="(Number(key)/100)+'金额'">
        <div>
          {{"总数:" + value.count }}
        </div>
        <div>
          {{"可用:" + value.stock }}
        </div>
      </Descriptions.Item>
    </Descriptions>
    <Descriptions title="账户统计" bordered v-else>
      <Descriptions.Item key="balance" label="今日销售总额" :span="2">
        {{ formatCurrency(todaySale) }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="今日订单总数">
        {{ todayOrder }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="昨日销售总额" :span="2">
        {{ formatCurrency(yesterdaySale) }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="昨日订单总数">
        {{ yesterdayOrder }}
      </Descriptions.Item>

      <Descriptions.Item key="balance" label="库存链接">
        {{ stockLink }}
      </Descriptions.Item>
      <Descriptions.Item key="balance" label="可用链接" :span="2">
        {{ availableLink }}
      </Descriptions.Item>
      <Descriptions.Item v-for="(value, key) in linkArr" :key="key" :label="(Number(key)/100)+'金额'">
        <div>
          {{"总数:" + value.count }}
        </div>
        <div>
          {{"可用:" + value.stock }}
        </div>
      </Descriptions.Item>
    </Descriptions>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watchEffect } from "vue";
import { Descriptions, Badge, Switch } from "ant-design-vue";
import { getStatistics,setOpenStatus } from "@/api/usersys/commission";
import { formatCurrency } from "@/utils";
import dayjs from "dayjs";
import { useUserStore } from "@/store/modules/user";
import { store } from "@/store";
const userStore = useUserStore(store);
defineOptions({
  name: "DashboardWelcome"
});
//在页面加载完成后执行
onMounted(() => {
  getDate();
});
const balance = ref("0");
const open = ref(false);
const todaySale = ref(0);
const todayOrder = ref(0);
const yesterdaySale = ref(0);
const yesterdayOrder = ref(0);
const ZHCount = ref(0);
const stockLink = ref(0);
const availableLink = ref(0);
const linkArr = ref([]);
const getDate = async () => {
  const res = await getStatistics(null);
  let data = res.data;
  console.log(data);
  if(userStore.userInfo.roleLabel == 'admin'){
    todayOrder.value =data.todayOrder;
    yesterdayOrder.value =data.yesterdayOrder;
    todaySale.value =Number(data.todaySale);
    yesterdaySale.value =data.yesterdaySale;
    ZHCount.value =Number(data.ZHCount);
    open.value = data.sysOpen;
  }
  else if (userStore.userInfo.roleLabel == 'proxy') {

    open.value = data.selfOpen;
    balance.value = formatCurrency(data.balance);
    //从data.topOrder 统计 昨天与今天的 销售总额

    todaySale.value = data.topOrder.reduce((a, b) => {
      if (dayjs(b.createdAt).format("YYYY-MM-DD") == dayjs().format("YYYY-MM-DD")) {
        todayOrder.value++;
        return a + b.amount;
      } else {
        return a;
      }
    }, 0);
    yesterdaySale.value = data.topOrder.reduce((a, b) => {
      if (dayjs(b.createdAt).format("YYYY-MM-DD") == dayjs().subtract(1, "day").format("YYYY-MM-DD")) {
        yesterdayOrder.value++;
        return a + b.amount;
      } else {
        return a;
      }
    }, 0);
    ZHCount.value = data.zh.length;

  }
  stockLink.value = data.link.length;
  availableLink.value = data.link.filter((item) => item.paymentStatus == 0).length;
  //遍历 link 的 amount 金额的类型 以及种类的数量 以及每种金额的数量状态0的数量 和 2 数量
  linkArr.value= data.link.reduce((a, b) => {
    if (a[b.amount]) {
      a[b.amount].count++;
      if (b.paymentStatus == 0) {
        a[b.amount].stock++;
      } else {
        a[b.amount].available++;
      }
    } else {
      a[b.amount] = {
        count: 1,
        stock: b.paymentStatus == 0 ? 1 : 0,
        available: b.paymentStatus == 0 ? 0 : 1
      };
    }
    return a;
  }, {});
  if (userStore.userInfo.roleLabel == 'top')  {

  }
};
const setOpen = async (e) => {
  console.log("开启关闭");
  await setOpenStatus({action:"open", open: e });
};

</script>

<style lang="less" scoped>
@import '@/styles/theme.less';

.themeBgColor(box);

.box {
  display: flex;
  padding: 12px;
  width: 100%;
  height: calc(100vh - 280px);
  flex-direction: column;

  img {
    min-height: 0;
    flex: 1;
  }

  .ant-form {
    flex: 2;
  }
}
</style>
