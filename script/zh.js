#!/usr/bin/env node
let t1 = new Date().getTime();
const SCRIPTCONFIG = require('../scriptconfig.json')
//加载配置文件
const CHROMEPATH = SCRIPTCONFIG.path; //浏览器路径
const HEADLESS = SCRIPTCONFIG.headless; //是否有界面
const USERDATADIR = SCRIPTCONFIG.UserDataDir;//环境保存路径 
const LOG = SCRIPTCONFIG.log;//是否输出
const LOGINTERVAL = SCRIPTCONFIG.loginterval;//输出间隔
const APIHOST = SCRIPTCONFIG.APIHOST;//服务器地址
const SCREEN = SCRIPTCONFIG.nowScreen;//是否截图
const SCRIPTTYPE = SCRIPTCONFIG.script_type;//脚本类型
const FILEPATH = SCRIPTCONFIG.downfilepath;//下载的文件路径

//进程参数
const ACCOUNT = process.argv[2]; // "1213182001@qq.com"; // process.argv[2];
const COOKIE = process.argv[3];
const ACTION = process.argv[4];
// 创建支付链接参数
var QUOTA
/**
 * 下游充值ID
 */
var PAYID;
/**
 * 上游充值ID
 */
var TOPID;
/**
 * 创建充值类型1 QQ 2 微信
 */
var CHANNEL;
if (ACTION == 'pay') {
  QUOTA = process.argv[7];
  PAYID = process.argv[8];
} else {
  QUOTA = process.argv[5];
  CHANNEL = process.argv[6];
  ZID = process.argv[7];
  TOPID = process.argv[8] != -1 ? process.argv[8] : 0;
  var proxyAdd = process.argv[9];
  var proxyPort = process.argv[10];
  console.log(`充值金额:${QUOTA} 充值类型:${CHANNEL} 充值账号:${ZID} 上游充值ID:${TOPID}`);
}
/**
 * sell_order id top_id
 */

const GAME = process.argv[5];
/**
 * 充值账号
 */
const PAYACCOUNT = process.argv[6];
const GAME_QU = process.argv[9];
// const PASSWORD = process.argv[4]; //"709394Aa"; //process.argv[3];
// const proxyUser = process.argv[4]; //"MAKE"; // process.argv[4];
// const proxyPassword = process.argv[5]; //"JIN"; //process.argv[5];



// const PROXY = "--proxy-server=socks5://" + process.argv[8];
var browserArgs = [
  // "--start-maximized",
  "--window-size=1920,1080",
  //
  // PROXY,
  // '--host-resolver-rules="MAP * ~NOTFOUND , E CLUDE myproxy"',
  "--disable-web-security", //关闭跨域安全
  // "--disable-gpu", //禁用gpu
  // "--no-sandbox", //禁止沙盒 //linux 时使用
  // "--disable-setuid-sandbox", //linux 时使用
  // '--lang=en_US',//强制英文
  "--disable-dev-shm-usage", //始终使用一个临时目录创建匿名共享内存文件
  // "--disk-cache-dir='D:/temp'"
];
proxyAdd ? browserArgs.push(`--proxy-server=${proxyAdd}:${proxyPort}`) : console.log("无需插入代理参数");
console.log(browserArgs);

//依赖
const fs = require("fs");
const dayjs = require('dayjs')
const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
const httpR = require('request-promise-native')
puppeteer.use(stealthPlugin); //必须使用插件对象才行
//代理
// const useProxy = require("puppeteer-page-proxy");
//反谷歌验证
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha", //平台id
      token: "e740f61431218083ef4caabc348e48af", //平台自己账号token
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);
const path = require("path");
const { rejects } = require("assert");
const browserPath = {
  chrome: path.join(__dirname, "/node_modules/puppeteer/.local-chromium/win64-1022525/chrome-win/chrome.exe"),
  local: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  linux: path.join(__dirname, "/node_modules/puppeteer/.local-chromium/linux-1022525/chrome-linux/chrome"),
};
console.log(CHROMEPATH, browserPath[CHROMEPATH]);
//到达验证页面 调用 await page.solveRecaptchas();
//随机ua
puppeteer.use(
  require("puppeteer-extra-plugin-anonymize-ua")({
    // customFn: (ua) => "MyCoolAgent/" + ua.replace("Chrome", "Beer"), //设置代理
  })
);
//反广告和追踪器 未处理好
/**
 * 添加adblocker插件，这将透明地阻止广告在所有页面你
 * 使用木偶创建
 */
// const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
// const adblocker = AdblockerPlugin({
//   blockTrackers: true, // default: false
// });
// puppeteer.use(adblocker);
const { log, sleep } = require("../mypup").pup
const p = require("../mypup").pup;

["chrome.runtime", "navigator.languages"].forEach((a) => stealthPlugin.enabledEvasions.delete(a));
process.on("message", (m) => {
  // console.log("接收到父进程信息", m);
  switch (m.action) {
    case 'code':
      CODE = m.code
      break;
    case 'taskid':
      taskid = m.taskid;
      break;
    default:
      break;
  }

});

//全局参数 ================================================================
var browser;
var page;
var frame;
const args = {
  runtime: 0, //整体进程运行时间
  curenttime: 0, //当前流程运行时间
  ai: 0, //脚本流程
  sai: 0,
  nowcid: 0,//现在下载筛选文件的国家id
  isrun: true,
};
var outime = false,
  accountbank = false,
  success = false;
var intervalId;
var groupCount = 1;
var CODE = null, taskid = 0, ACTIONRESULT = '', pay_link = null, COMFIRMACCOUNT = null, oid = null;
// var buf = fs.readFileSync("./xx.png");

var { runtime, curenttime, ai, sai, nowcid, isrun } = args;
var alist = ["init", "loginpage", "login", "upfile", "getdata", "delContacts"];
var actionN = [
]
//全局参数 ================================================================
function deleteFolder(path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function (file, index) {
      let curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
async function main() {
  let arg = {
    headless: HEADLESS,
    executablePath: browserPath[CHROMEPATH], //C:/Program Files/Google/Chrome/Application/chrome.exe 'D:\/git\/auto-pup-winclient\/exe\/multilogin.exe'
    args: browserArgs,
    userDataDir: path.join(USERDATADIR, `${ACCOUNT}`),
    ignoreDefaultArgs: ["--enable-automation"],
  }
  console.log(arg);
  browser = await puppeteer.launch(arg);

  //新建线程递增runtime
  intervalId = setInterval(async () => {
    runtime++;
    if (isrun) curenttime++;
    if (runtime % LOGINTERVAL == 0) {
      // console.log(`${ACCOUNT}当前流程:`, alist[ai], "子流程:" + `${actionN[ai][sai]} ==>`, "当前流程运行时间:", curenttime, "秒", "总运行时间:=>", runtime + "秒");
      // console.log(`status|当前流程: ${alist[ai]} 子流程: ${actionN[ai][sai]} ==> 当前流程运行时间: ${isrun ? curenttime + '秒' : "暂停中"}  总运行时间:=> ${runtime} + 秒 | ${isrun ? 1 : 0}`)
      log(`${ai}====>${sai}`)
    }
    if (runtime > 270) {
      outime = true
    }
    if (SCREEN) {
      await page.screenshot({ path: `./error/${ACCOUNT}-now.png` });
    }
    // try {
    //   let t = await page.title();
    //   console.log(`页面标题为：${t}`);
    // } catch (error) {
    //   await errorHandler(error);
    // }
  }, 1000);
  try {
    while (true) {
      if (isrun) {
        let temp = ai;
        try {
          if (ai < 2) {
            await action[alist[ai]]();
          } else {
            await action[ACTION]();
          }

        } catch (error) {
          await errorHandler(error);
        }

        if (temp != ai || ai == 400) {
          //执行action发生改变 则重置当前执行次数
          curenttime = 0;

        }
        await catchError();

        if (ai > alist.length - 1) {
          console.log("执行完毕");
          if (groupCount > 1) {
            success = true
          }
          break;
        }

        if (outime) {
          if (ACTION == 'pay') {
            await page.screenshot({ path: `./public/sell/${ACCOUNT}/` + PAYID + '-' + PAYACCOUNT + '.png' });
            process.send({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, top_zh: PAYACCOUNT, sellid: PAYID })

          } else if (ACTION == 'top') {
            if (CHANNEL == '1') {
              process.send({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, channel: CHANNEL })
            } else if (CHANNEL == '2') {
              process.send({ action: 'topVX', zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, channel: CHANNEL })
            }
          }

          break;
        }
        if (accountbank) {
          break;
        }
        if (success) {
          if (ACTION == 'pay') {
            process.send({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: ACTIONRESULT, quota: QUOTA, top_zh: PAYACCOUNT, sellid: PAYID })
          } else if (ACTION == 'top') {
            process.send({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid })
          }

          break
        }

      }
      await p.sleep(100);
    }
  } catch (error) {
    console.log("执行线程", error);
  }

  //清除定时器
  try {
    // await page.screenshot({ path: `./error/${ACCOUNT}-over.png` });
    clearInterval(intervalId);

    //执行回调输出
    // await page.evaluate(evaluateRules);
    // 发送结果 发送数量 执行时间
    await browser.close();

  } catch (error) {
    console.log("关闭出错", error);
  }

}
var action = {
  init: async function () {
    if (!page) {

      [page] = await browser.pages();
      if (page) {

      }
      if (ACTION == 'top') {
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');
        await page.setViewport({ width: 375, height: 812 });
      }

      // page.authenticate({ username: '13377503850', password: '123456' });
      //对请求封包拦截器 禁止PNG文件访问
      await page.setRequestInterception(true); //开启封包拦截
      page.on("request", requestHandler);
      //对响应封包拦截
      page.on("response", responseHandler);
      page.on('pageerror', errorHandler);
      page.on('console', logHandler)
    } else {
      //设置页面cookie
      let cookieArray = COOKIE.split(';')
      //构造cookie对象
      let cookies = []
      cookies.push({
        domain: '.pay.qq.com',
        hostOnly: false,
        httpOnly: false,
        name: 'currentAccountType',
        path: '/',
        sameSite: 'unspecified',
        secure: false,
        session: true,
        storeId: '0',
        value: 'QQ',
        id: 0
      })
      for (let i = 0; i < cookieArray.length; i++) {
        if (cookieArray[i].indexOf('=') > -1) {
          let t = cookieArray[i].split('=')
          if (t[0] != '__qc__k') {
            let ct = {}
            if (t[0] == 'ptcz' || t[0] == 'RK') {
              ct = {
                domain: '.qq.com',
                value: t[1],
                expirationDate: 1701316530.907421,
                hostOnly: false,
                httpOnly: false,
                name: t[0],
                path: '/',
                sameSite: 'unspecified',
                secure: false,
                session: false,
                storeId: '0',

                id: i + 1
              }
            }
            // else if (t[0] == '_qpsvr_localtk') {
            //   ct = {
            //     domain: '.qq.com',
            //     hostOnly: false,
            //     httpOnly: false,
            //     name: t[0],
            //     path: '/',
            //     sameSite: 'unspecified',
            //     secure: false,
            //     session: true,
            //     storeId: '0',
            //     value: t[1],
            //     id: i + 1
            //   }
            // } 
            else if (t[0] == '__qc_wId') {
              ct = {
                domain: 'pay.qq.com',
                hostOnly: true,
                httpOnly: false,
                name: t[0],
                path: '/',
                sameSite: 'unspecified',
                secure: false,
                session: true,
                storeId: '0',
                value: t[1],
                id: i + 1
              }
            }
            else {
              ct = {
                domain: '.pay.qq.com',
                hostOnly: false,
                httpOnly: false,
                name: t[0],
                path: '/',
                sameSite: 'unspecified',
                secure: false,
                session: true,
                storeId: '0',
                value: t[1],
                id: i + 1
              }
            }
            cookies.push(ct);
          }
          else {
            let ct = {};
            ct = {
              domain: 'pay.qq.com',
              hostOnly: true,
              httpOnly: false,
              name: t[0],
              path: '/',
              sameSite: 'unspecified',
              secure: false,
              session: true,
              storeId: '0',
              value: t[1] + '=' + t[2],
              id: i + 1
            }

            cookies.push(ct);
          }
        }
      }
      // console.log(JSON.stringify(cookies));
      for (let i = 0; i < cookies.length; i++) {
        await page.setCookie(cookies[i]) //载入cookie
      }
      ai++;
    }
  },
  isgoto: false,
  loginpageinit: function () {
    this.isgoto = false
  },

  signin: `/html/body/div[1]/div[1]/div/div/div/div[2]/a`,
  loginpage: async function () {
    let click_top = `/html/body/div[2]/div/div[2]/div[1]/div[2]/form/div[2]/button[1]`
    if (curenttime > 120) {
      outime = true;
    }
    if (!this.isgoto) {
      console.log(`账号:${ACCOUNT},执行${ACTION}`);
      await page.goto("https://pay.qq.com/h5/shop.shtml");
      let i = 0;
      do {
        await sleep(100);
        i++;
        let r = await p.find(page, click_top);
        await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div`);
        if (i > 15 || r) {
          break
        }
      } while (true)
      this.isgoto = true;
    }
    let click_top_ex = await p.find(page, click_top);
    if (click_top_ex) {
      this.loginpageinit();
      ai++;
    }
    await outtimeHandler(120)
  },
  checkinit() {
    sai = 0;
    this.ssai = 0;
  },
  ssai: 0,
  check: async function () {
    // console.log(`现在ai:${ai},sai:${sai},ssai:${this.ssai}`);
    let zhyeXP = `/html/body/div[2]/div/div[1]/div/div[3]/div[1]/div/p`
    // console.log("执行check");
    switch (sai) {
      case 0: //查询余额
        switch (this.ssai) {
          case 0:
            let r = await p.findClick(page, `/html/body/div[2]/div/div[2]/div[1]/div[1]/div/div/div[1]`);
            if (r) await p.sleep(500);
            let zhyeXP_ex = await p.find(page, zhyeXP);
            if (zhyeXP_ex) {
              this.ssai++;
            }
            break;
          case 1:
            let zhye = await p.find(page, zhyeXP);
            if (zhye) {
              let text = await p.innerHTMLbyEle(zhye);
              if (text) {
                let account = Number(text);
                // console.log(`${ACCOUNT}账号余额：${account}`);
                sai++;
                this.ssai = 0;
              }
            }
            break;
          default:
            break;
        }
        break;
      case 1: //查询订单详情 
        // console.log("查询订单详情");
        switch (this.ssai) {
          case 0:
            //先进入 交易列表 
            await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div/div[1]`);
            await p.sleep(1000);
            let tjylie = await p.find(page, `/html/body/div[1]/section/article/section/div/section/div/div[1]/div[1]/span`);//全部交易
            let text = await p.innerHTMLbyEle(tjylie);
            if (text == '全部交易') {
              this.ssai++;
            }
            break;
          case 1:
            //获取所有订单列表数据
            // let ls = await p.find(page, `#app > section > article > section > div > div > ul`);
            // if (ls) {
            //   //执行循环点击获取订单详情
            //   let lils = await ls.$$('li')
            //   if (lils && lils.length > 0) {
            //     for (let i = 0; i < array.length; i++) {
            //       lils[i].click() //进入订单详情界面

            //     }
            //   }
            // }
            await p.sleep(1000 * 1000)
            break
          default:
            break;
        }
        break
      default:
        break;
    }
    if (curenttime > 300) {
      outime = true;
    }
  },

  //点击QB支付
  QBcheckpay: async function () {
    let tframe = await page.frames();
    log('当前框架数量：' + tframe.length);
    for (let index = 0; index < tframe.length; index++) {
      if (tframe.length >= 7) {
        let closeBtn = `/html/body/div[5]/div/div[2]/div/div[1]/a`;
        for (let i = 0; i < tframe.length; i++) {
          console.log("关闭按钮");
          let r = await p.findClick(tframe[i], closeBtn);
          if (r) break;
        }
      } else {
        let content = await tframe[index].content();
        if (content.indexOf('react-text: 26') > -1) {
          let QBTEXT = await p.findAll(tframe[index], `.fpm-ui-cell-txt`);
          if (QBTEXT.length > 0) {
            // if(GAME=='DNF'){
            await QBTEXT[0].click();
            // }else{

            // for (let i = 0; i < QBTEXT.length; i++) {
            //   let bname = await p.innerHTMLbyEle(QBTEXT[i]);
            //   if (bname.indexOf('Q币') > -1) {
            //     //获取QB坐标
            //     console.log("准备点击了QB支付");
            //     await sleep(3000);
            //     let sss = await p.find(tframe[index], `.fpm-icon.fpm-icon-qb`);
            //     console.log("点击了QB支付");
            //     await sss.click();
            //     await sleep(3000);
            //     break
            //   }
            // }
            // }
          }
        }
      }

    }
    await p.sleep(3000)
    if (await this.checkchangeVerfiy()) {
      sai++;
    }
  },
  checkchangeVerfiy: async function () {
    let tframe = await page.frames();
    for (let index = 0; index < tframe.length; index++) {
      let content = await tframe[index].content();
      if (content.indexOf('changeVerifyType') > -1) {
        return true
      }
    }
  },
  clickchangeVerfiy: async function () {
    //点击切换验证码
    let tframe3 = await page.frames();
    console.log("frames index 6  count=>" + tframe3.length);
    let changeVerfiyfun = `/html/body/div[1]/div/div[2]/form/div[2]/a[1]`;
    let aqfun = `/html/body/div/div/div[2]/ul/li[3]`
    let viewpass = null;
    for (let index = 0; index < tframe3.length; index++) {
      let isex = await p.find(tframe3[index], changeVerfiyfun);
      // let  viewpasst = await p.find(tframe3[index], '/html/body/div[1]/div/div[2]/form/ul/li/input');
      if (isex) {
        await isex.click();
        await p.sleep(3000);
        await p.findClick(tframe3[index], aqfun);
        await p.sleep(3000);
        viewpass = await p.find(tframe3[index], '/html/body/div[1]/div/div[2]/form/ul/li/input');
        break;
      }
    }
    if (tframe3.length > 6 && viewpass) {
      frame = tframe3[6];
      //创建获取验证码的任务
      process.send({ action: 'upcode', zh: ACCOUNT });
      sai++;
    }
    let tframe = await page.frames();
    for (let index = 0; index < tframe.length; index++) {
      let content = await tframe[index].content();
      if (content.indexOf('changeVerifyType') > -1) {
        let rd = await p.findClick(tframe[index], `.changeVerfiy`);
        if (rd) {
          console.log("checkout aq_code");
          await p.sleep(5000)
          break
        }
      }
    }
  },
  gotoInputAccount: async function (url, arginput) {
    if (!this.gotourl) {
      await page.goto(url);
      await page.waitForXPath(arginput);
      this.gotourl = true
    } else {
      let r = await p.inputText(page, arginput, PAYACCOUNT, false); //输入充值账号
      if (r) {
        sai++;
      }
    }
  },
  clickdianjuan: async function (dianjuan) {
    let topnow = `/html/body/div[2]/div/div/div[5]/div[2]/div[2]/button`;
    await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div`)
    await p.findClick(page, dianjuan);//点击点券输入栏
    let topnow_ex = await p.find(page, topnow);
    if (topnow_ex) {
      sai++;
    }
  },
  inputdianjuancomfirmAccount: async function (input) {
    //输入点券
    let input2 = `/html/body/div[2]/div/div/div[5]/div[2]/div[2]/div/input`;
    let r2 = await p.inputText(page, input2, (Number(QUOTA) * 100).toString(), false);//输入充值数量
    //确定是否是被冲客户号码
    let ZH_ex = await p.find(page, input);
    if (ZH_ex) {
      let text = await ZH_ex.getProperty('value');
      let inputZH = await text.jsonValue()
      log(`sai2 充值账号：${inputZH}`);
      if (inputZH && inputZH == PAYACCOUNT && r2) {
        sai++;
      }
    }
    if (curenttime > 30) {
      await reload();
      this.payinit();
    }
  },
  clicktopcomfirm: async function () {
    //点击马上充值 并且框架增加 代表 点击成功
    let topnow = `/html/body/div[2]/div/div/div[5]/div[2]/div[2]/button`;
    let r = await p.findClick(page, topnow);
    if (r) await sleep(1500);
    //查找第二个框架frame 
    //更新框架
    let tframe = await page.frames();
    if (r && COMFIRMACCOUNT && COMFIRMACCOUNT == PAYACCOUNT && tframe && tframe.length >= 3) {
      sai++;
    }
  },
  createcodetask: async function () {
    if (CODE) {
      sai++;
    } else {
      //发送获取验证码任务
      process.send({ action: 'code', zh: ACCOUNT });
      await p.sleep(1000)
    }
    //判断是否繁忙
    // let busy_ex = await p.find(frame, `/html/body/div[1]/div/div[2]/form/h3[2]`);
    // if (busy_ex) {
    //   let tisb = await p.innerHTMLbyEle(frame, busy_ex);
    //   if (tisb && tisb.indexOf('操作过于频繁') > -1) {
    //     if (ACTION == 'pay') {
    //       process.send({ action: 'busy', zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, top_zh: PAYACCOUNT, sellid: PAYID })
    //     } else if (ACTION == 'top') {
    //       process.send({ action: 'busy', zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, topid: TOPID })
    //     }
    //   } else if (tisb && tisb.indexOf('动态密码有误或过期') > -1) {//判断是否错误
    //     //重新获取验证码
    //     process.send({ action: 'code', zh: ACCOUNT });
    //     await p.sleep(5000)
    //   }
    //   console.log(tisb);
    // }
  },
  inputcodeComfirm: async function () {
    console.log(`CODE is ${CODE}`);
    let paysuccess2 = await p.find(page, `/html/body/div[2]/div/div/div/div[1]/div[1]/div[2]/p`);
    if (paysuccess2) {
      let now = dayjs().format('YYYY-MM-DD HH-mm-ss')
      console.log(`elapsed time ${new Date().getTime() - t1}`);
      //判断error中是否存在ACCOUNT 对应文件夹不存在则创建
      isEXtoCreate(ACCOUNT);
      await page.screenshot({ path: `./public/sell/${ACCOUNT}/` + PAYID + '-' + PAYACCOUNT + '.png' });
      ACTIONRESULT = '成功'
      success = true
    } else {
      //请求安全码输入
      let ri = await p.inputText(frame, `/html/body/div[1]/div/div[2]/form/ul/li/div/input`, CODE, false);
      if (ri) {
        let rcomfir = await p.findClick(frame, `/html/body/div[1]/div/div[2]/form/div[1]/button`)
        if (rcomfir) {
          await p.sleep(5000);
        }
        let busy_ex = await p.find(frame, `/html/body/div[1]/div/div[2]/form/h3[2]`);
        if (busy_ex) {
          let tisb = await p.innerHTMLbyEle(frame, busy_ex);
          if (tisb && tisb.indexOf('操作过于频繁') > -1) {
            log(`${ACCOUNT}安全码频繁`);
            if (ACTION == 'pay') {
              process.send({ action: 'busy', zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, top_zh: PAYACCOUNT, sellid: PAYID })
            } else if (ACTION == 'top') {
              process.send({ action: 'busy', zh: ACCOUNT, insertId: taskid, result: "超时", quota: QUOTA, topid: TOPID })
            }
          } else if (tisb && tisb.indexOf('动态密码有误或过期') > -1) {//判断是否错误
            CODE = null;
            sai--;
          }
          console.log(tisb);
        } else {
          console.log("提示框不存在");
        }

      } else {
        console.log("安全码输入失败");
      }
    }


  },
  payinit() {
    this.gotourl = false
    this.ot = 0
    curenttime = 0
  },
  gotourl: false,
  ot: 0,
  async pay() {
    //填入账号
    let input = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[2]/div[4]/div/div/div[2]/div/div[2]/div/div/div[1]/div/label/div/div/input`
    //点击输入点券
    let dianjuan = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[2]/div[4]/div/div/div[2]/div/div[2]/div/div/div[2]/ul[1]/li[3]/div/h4`
    let topnow = `/html/body/div[2]/div/div/div[5]/div[2]/div[2]/button`;
    let input2 = `/html/body/div[2]/div/div/div[5]/div[2]/div[2]/div/input`;
    if (GAME && PAYACCOUNT && QUOTA) {
      switch (GAME) {
        case "DNF"://template
          switch (sai) {
            case 0:
              //前往并输入账号
              let DNFurl = `https://pay.qq.com/h5/shop.shtml?r=0.29201068693955645#/order/74/biz/95?pfStructure=search&serviceZone=1&zoneTabId=100`;
              await this.gotoInputAccount(DNFurl, input);
              break;
            case 1:
              let dianjuan = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[2]/div[4]/div/div/div[2]/div/div[2]/div/div/div[2]/ul[1]/li[3]/div/h4`
              await this.clickdianjuan(dianjuan);
              break
            case 2:
              //输入点券确定账号是否正确

              await this.inputdianjuancomfirmAccount(input);
            case 3:
              //点击马上充值 并且框架增加 代表 点击成功
              await this.clicktopcomfirm();
              break
            case 4:
              //点击QB支付 
              await this.QBcheckpay();
              this.ot++;
              if (this.ot > 10) {
                this.payinit();
                sai = 0;
              }
              break
            case 5:
              await this.clickchangeVerfiy();
              break
            case 6:
              await this.createcodetask();
              break
            case 7:
              await this.inputcodeComfirm();
              break
            default:
              break;
          }
          break;
        case "LOL":
          let LOLdianjuan = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[2]/div[4]/div/div/div[2]/div/div[2]/div/div/div[3]/ul[1]/li[3]/div`
          let qucXP = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[2]/div[4]/div/div/div[2]/div/div[2]/div/div/div[2]/p`;//点击选区 也用来判断是否选区正确
          switch (sai) {
            case 0:
              //前往并输入账号
              let LOLurl = `https://pay.qq.com/h5/shop.shtml?r=0.24964145709180174#/order/73/biz/93?pfStructure=common2&serviceZone=1&zoneTabId=100`
              await this.gotoInputAccount(LOLurl, input);
              break;
            case 1://开始选区
              // await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div`);

              let lilist = await p.findAll(page, `.ui-cell-bd`);
              if (lilist.length > 15) {
                sai++;

              } //实际现在28个
              await p.findClick(page, qucXP);
              await sleep(1500)
              break
            case 2:
              let tquXp = await p.find(page, qucXP)
              if (tquXp) {
                let quInputText = await p.innerHTMLbyEle(page, tquXp);
                if (quInputText.indexOf(GAME_QU) > -1) {
                  sai++;
                }
              }

              //点击选区判断
              let lilist2 = await p.findAll(page, `.ui-cell-bd`);
              for (let i = 0; i < lilist2.length; i++) {
                let qu = await p.innerHTMLbyEle(lilist2[i])
                if (qu && qu.indexOf(GAME_QU) != -1) {
                  console.log("找到适合" + qu);
                  try {
                    await lilist2[i].click()
                  } catch (error) {
                    console.log(error);
                  }
                  await sleep(1500);
                  break
                }
              }

              break
            case 3:
              await this.clickdianjuan(LOLdianjuan);
              break
            case 4:
              //输入点券确定账号是否正确

              await this.inputdianjuancomfirmAccount(input);
            case 5:
              //点击马上充值 并且框架增加 代表 点击成功
              await this.clicktopcomfirm();
              break
            case 6:
              //点击QB支付 
              await this.QBcheckpay();
              this.ot++;
              if (this.ot > 10) {
                this.payinit();
                sai = 0;
              }
              break
            case 7:
              await this.clickchangeVerfiy();
              break
            case 8:
              await this.createcodetask();
              break
            case 9:
              await this.inputcodeComfirm();
              break
            default:
              break;
          }
          break
        case "CF":
          let DAQU = GAME_QU.split('-')[0]
          let XIAOQU = GAME_QU.split('-')[1]
          let CFdianjuan = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[1]/div/div[3]/div/div[2]/ul[1]/li[3]/div`
          let CFqucXP = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[2]/div[4]/div/div/div[2]/div/div[2]/div/div/div[2]/p`;//点击选区 也用来判断是否选区正确

          let cfinput = `/html/body/div[2]/div/div/div[3]/div/div[3]/div[1]/div/div[2]/div/label/div/div/input`
          switch (sai) {
            case 0:
              //前往并输入账号
              let CFurl = `https://pay.qq.com/h5/shop.shtml?r=0.7844953336757257#/order/75/biz/97?pfStructure=service_list_search&serviceZone=1&zoneTabId=100`
              await this.gotoInputAccount(CFurl, cfinput);
              break;
            case 1:
              await this.clickdianjuan(CFdianjuan);
              break
            case 2:
              //输入点券确定账号是否正确
              await this.inputdianjuancomfirmAccount(cfinput);
            case 3:
              //点击马上充值 出现分区选择
              let lilist = await p.findAll(page, `.ui-cell-bd`);
              if (lilist && lilist.length > 10) {
                sai++;
              }
              await this.clicktopcomfirm();
              break
            case 4:
              //选大区
              let CFlilist2 = await p.findAll(page, `.ui-cell`);
              for (let i = 0; i < CFlilist2.length; i++) {
                let qu = await p.innerHTMLbyEle(CFlilist2[i])
                if (qu && qu.indexOf(DAQU) != -1) {
                  console.log("找到适合");
                  // let b = await qu.boundingBox();
                  // console.log(b);
                  await CFlilist2[i].click();
                  await sleep(3000);
                  let t = await p.findAll(page, '.ui-cell')
                  if (t.length != CFlilist2.length) {
                    sai++;
                  }

                  break
                }
              }
              break
            case 5:
              //选分区
              console.log("选分区");
              let CFlilist3 = await p.findAll(page, `.ui-cell`);
              for (let i = 0; i < CFlilist3.length; i++) {
                let qu = await p.innerHTMLbyEle(CFlilist3[i])
                if (qu && qu.indexOf(XIAOQU) != -1) {
                  console.log("找到适合");
                  // let b = await qu.boundingBox();
                  // console.log(b);
                  await CFlilist3[i].click();
                  await sleep(2000);
                  sai++;
                  break
                }
              }
              break
            case 6:
              await this.clickdianjuan(CFdianjuan);
              break
            case 7:
              //输入点券确定账号是否正确
              await this.inputdianjuancomfirmAccount(cfinput);
            case 8:
              //点击马上充值框架更新
              await this.clicktopcomfirm();
              break
            case 9:
              //点击QB支付 
              await this.QBcheckpay();
              this.ot++;
              if (this.ot > 10) {
                this.payinit();
                sai = 0;
              }
              break
            case 10:
              await this.clickchangeVerfiy();
              break
            case 11:
              await this.createcodetask();
              break
            case 12:
              await this.inputcodeComfirm();
              break
            default:
              break;
          }
          break

        default:
          console.log("没有该类型充值");
          break;
      }
    } else {
      ACTIONRESULT = '失败'
      success = true
    }

  },
  topinit() { },
  async top() {
    // await p.sleep(6000 * 1000)
    if (runtime > 120) {
      outime = true
    }
    switch (sai) {
      case 0:
        let nowfarmes0 = await page.frames();
        console.log(nowfarmes0.length);
        //判断充值金额 
        if (Number(QUOTA) == 100) {
          //点击 100按钮
          let ZH100XP = `/html/body/div[2]/div/div[2]/div[1]/div[2]/form/div[2]/div[1]/div[1]/div[2]/div[3]`
          let ZH100XPC = await p.findClick(page, ZH100XP)
          if (ZH100XPC) {
            sai++;
          }
        } else {
          //输入金额
          let ZHINPUTXP = `/html/body/div[2]/div/div[2]/div[1]/div[2]/form/div[2]/div[1]/div[1]/div[2]/div[4]/input`
          let ZHINPUTXPC = await p.inputText(page, ZHINPUTXP, QUOTA, false)
          if (ZHINPUTXPC) {
            sai++;
          }
        }

        await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div`); //点击充值协议同意按钮
        break;
      case 1:
        //点击充值
        await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div`); //点击充值协议同意按钮
        console.log("判断框架数量");
        await p.findClick(page, `/html/body/div[2]/div/div[2]/div[1]/div[2]/form/div[2]/button[1]`)
        //判断框架数量
        let nowfarmes1 = await page.frames();
        // console.log(nowfarmes1.length);
        if (nowfarmes1.length >= 3) {
          frame = nowfarmes1[2];
          sai++;
        }
        break
      case 2:

        //判断是否成功创建订单
        if (success) {
          break
        }

        //点击钱包支付
        let ttframe = await page.frames();
        //console.log(`框架数量${ttframe.length}`);

        // for (let i = 0; i < ttframe.length; i++) {
        // let ff = await p.find(page, `/html/body/div[2]/div/div[2]/div[1]/div[2]/form/div[1]/h2`)
        // if (ff) {
        //   let sss = await ff.boundingBox();
        //   console.log(sss);
        // }
        //{ x: 27, y: 448, width: 1850, height: 45 }
        switch (Number(CHANNEL)) {
          case 1:
            let sinew = false;
            for (let j = 0; j < ttframe.length; j++) {
              let ct = await ttframe[j].content()
              console.log(ct.indexOf('确认支付') > -1 ? j + '存在' : '不存在');

              //判断新版旧版
              if (ct.indexOf('确认支付') > -1) {
                sinew = true;
                await ttframe[j].click(`.mds-pay-item_qq`);
                await p.sleep(2 * 1000);
                await ttframe[j].click(`.mds-dialog-btn`)
              }
            }
            await p.sleep(1 * 1000);
            if (!sinew) {
              let qq = await p.find(ttframe[2], `/html/body/div[1]/div/div[2]/div[2]/div[1]/div[1]`)
              if (qq) {
                await qq.click();
                break
              } else {
                //尝试直接点击
                await page.mouse.click(227, 400);
                // await sleep(3000);
              }
            }

            break;
          case 2:
            let vx = await p.find(ttframe[2], `/html/body/div[1]/div/div[2]/div[2]/div[1]/div[2]`)
            if (vx) {
              await vx.click();
              break
            } else {
              await page.mouse.click(227, 450);
            }
            break
          default:
            console.log("无选择支付通道");
            break;
        }

        // }

        //判断是否成功创建订单

        let checkframe = await page.frames();
        if (checkframe.length > 5) {
          sai++;
        }
        if (oid && pay_link && CHANNEL == '1') {
          ACTIONRESULT = '成功'
          console.log({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid });
          success = true
        } else if (oid && pay_link && CHANNEL == '2') {
          ACTIONRESULT = '成功'
          console.log({ action: "topVX", zh: ACCOUNT, topid: TOPID, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid, channel: CHANNEL });
          process.send({ action: "topVX", zh: ACCOUNT, topid: TOPID, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid, channel: CHANNEL });
        }
        break
      case 3:
        //出现风险 需要过验证
        //现在执行 验证处理
        // if()
        if (oid && pay_link && CHANNEL == '1') {
          ACTIONRESULT = '成功'
          console.log({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid });
          success = true
        } else if (oid && pay_link && CHANNEL == '2') {
          ACTIONRESULT = '成功'
          console.log({ action: "topVX", zh: ACCOUNT, topid: TOPID, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid, channel: CHANNEL });
          process.send({ action: "topVX", zh: ACCOUNT, topid: TOPID, result: ACTIONRESULT, quota: QUOTA, pay_link: pay_link, zid: ZID, oid: oid, channel: CHANNEL });
        } else {

          if (CHANNEL == '1') {
            console.log(CHANNEL, "QQ风险验证失败");
            process.send({ action: ACTION, zh: ACCOUNT, insertId: taskid, result: '风险验证', quota: QUOTA, pay_link: '风险验证', channel: CHANNEL })
          } else if (CHANNEL == '2') {
            console.log(CHANNEL, "VX风险验证失败");
            process.send({ action: "topVX", zh: ACCOUNT, topid: TOPID, result: '风险验证', quota: QUOTA, pay_link: '风险验证', channel: CHANNEL })
          }

        }

        //截取当前全屏/截取当前框架
        // let checkframe2 = await page.frames();
        // console.log(`风险验证框架数量${checkframe2.length}`);
        // await page.screenshot({
        //   path: `D:\\0git\\0myJob\\feng_zh_handler\\zh_handler_puppeteer\\testview\\main.png`, clip: {
        //     x: 0,
        //     y: 0,
        //     width: 1920,//(1920-280)/2
        //     height: 1080//(1080-226)/2
        //   }
        // });
        // if (checkframe2.length > 3) {
        //   for (let i = 0; i < checkframe2.length; i++) {
        //     let fn = checkframe2[i].name();
        //     let ftitle = await checkframe2[i].title();
        //     console.log(`框架名称${fn},框架标题${ftitle}`);
        //     //每个框架截图范围位置截图

        //   }
        //   await page.screenshot({
        //     path: `D:\\0git\\0myJob\\feng_zh_handler\\zh_handler_puppeteer\\testview\\code.png`, clip: {
        //       x: (1920 - 305) / 2,
        //       y: (1080 - 310) / 2,
        //       width: 285,//(1920-280)/2
        //       height: 226//(1080-226)/2
        //     }
        //   });
        // }
        // await sleep(60 * 1000)
        //进程通讯 通知主进程 出现验证

        //等待主进程通知

        //点击验证位置

        //判断点击是否出现频繁


        // await page.screenshot({ path: `./public/code/${ACCOUNT}/` + PAYID + '-' + PAYACCOUNT + '.png' });
        break
      case 1:
        break
      case 1:
        break
      default:
        break;
    }
  }
};

function isEXtoCreate(zh) {
  let _path = `C:\\Users\\Administrator\\Desktop\\qq_handler_back\\public\\sell\\` + zh
  if (!fs.existsSync(_path)) {
    fs.mkdirSync(_path);
  }

}
async function catchError() {
  if (ai < 2) {
    await p.findClick(page, `/html/body/div[2]/div/div[2]/div[2]/div`); //点击充值协议同意按钮
  }

  // if (runtime > config.outtime) {
  //   // await page.screenshot({ path: "../error/error.png" });
  //   ai = alist.length;
  //   outime = true
  //   console.log("执行时间超出关闭进程");
  // }
}
async function outtimeHandler(time) {
  // if (curenttime > time) {
  //   let pageHTML = await page.content();
  //   fs.writeFileSync(`./errorhtml/${ACCOUNT}-${action[ai]}-${sai}.html`, pageHTML);
  // }
}
async function errorHandler(error) {
  console.log(error);
  // if (error.toString().indexOf("navigation.") == -1 && error.toString().indexOf("failed to find element") == -1) {
  //   if (SCREEN) {
  //     await page.screenshot({ path: "./error/" + ACCOUNT + alist[ai] + "-" + runtime + "error.png" });
  //   }
  //   await p.sleep(1000);
  //   console.log(error);
  //   // fs.appendFileSync("../errorhtml/error.txt", error)
  // }
}
async function logHandler(msg) {
  if (ACTION == 'top') {
    for (let i = 0; i < msg.args().length; ++i) {
      if (CHANNEL == '1') {
        let d = await msg.args()[i].jsonValue();
        if (d && d.indexOf && d.indexOf('mqqapi') > -1) {
          pay_link = d.match(/.*"url":"(.*)"}}/)[1]
          ACTIONRESULT = "成功"
          console.log(pay_link);
          await p.sleep(10000)
          // success = true
        }
      } else if (CHANNEL == '2') {
        let d = await msg.args()[i].jsonValue();
        if (d && d.indexOf && d.indexOf('weixin') > -1) {
          pay_link = d.match(/.*"url":"(.*)"}}/)[1]
          ACTIONRESULT = "成功"
          console.log(pay_link);
          await p.sleep(10000)
          // success = true
        }
      }

    }
  }
}
async function reload() {
  //强制刷新页面
  try {
    log("强制刷新页面")
    await page.reload();
    //初始化数据
  } catch (error) {
    await errorHandler(error);
  }
}
//请求拦截处理
async function requestHandler(e) {
  if (e.url().indexOf('https://api.unipay.qq.com/v1/r/1450000186/wechat_query') > -1) {
    //判断是否携带指定参数
    if (e.postData() && e.postData().indexOf('provide_uin') > -1) {
      let d = e.postData().toString().match(/.*provide_uin=(.*)/)[1]
      COMFIRMACCOUNT = d
      console.log("充值账号" + COMFIRMACCOUNT);
    }
  }

  e.continue(); //继续
}
//响应拦截处理
async function responseHandler(e) {
  //         包含      account/verifyimg
  // if (e.url().includes(".png")) {
  //   //对 获取的响应的body进行分析
  // }
  if (e.url().indexOf('/v1/r/1450000490/mobile_save') > -1) {
    let d = await e.json()
    console.log("响应拦截获取订单号", d);
    if (d.info.portal_serial_no) {
      oid = d.info.portal_serial_no
    }
  }

  if (e.url().indexOf('trade_record_query') > -1) {
    try {
      let r = await e.json()
      if (r) {
        let ls = r.WaterList
        let res = []
        for (let i = 0; i < ls.length; i++) {
          let cD = dayjs.unix(ls[i].PayTime).format('YYYY-MM-DD HH:mm')

          console.log(`订单类型 ${ls[i].ProductName == 'Q币' ? "充值=>Q币" : "消费=>" + ls[i].ProductName} ,金额:${ls[i].PayAmt / 100},${ls[i].PayItem.indexOf('|') > -1 ? `被充值账户${ls[i].PayItem.split('|')[1]}` : ''}支付时间:${cD},支付状态:${ls[i].CurrentState == 101 ? "成功" : "尚未支付"}`);
          res.push(`订单类型 ${ls[i].ProductName == 'Q币' ? "充值=>Q币" : "消费=>" + ls[i].ProductName} ,金额:${ls[i].PayAmt / 100},${ls[i].PayItem.indexOf('|') > -1 ? `被充值账户${ls[i].PayItem.split('|')[1]}` : ''}支付时间:${cD},支付状态:${ls[i].CurrentState == 101 ? "成功" : "尚未支付"}`)
        }
        console.log(`result|${ACTION}|success|${ACCOUNT}|${JSON.stringify(res)}`);
        success = true
        // console.log(`${JSON.stringify(r)}`);
      }
      console.log(`耗时${new Date().getTime() - t1}`);
    } catch (error) {
      console.log("订单解析json出错", error);
    }
  }
  if (!e.ok()) {
    log(e.status(), "============>", e.url())
  }
}
main();
