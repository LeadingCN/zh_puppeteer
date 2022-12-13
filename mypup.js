const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
["chrome.runtime", "navigator.languages"].forEach((a) => stealthPlugin.enabledEvasions.delete(a));
const stringRandom = require("string-random");
const r = require("request-promise-native");
const config = require("./config");
const APIHOST = config.APIHOST;
const pup = {};
const fs = require('fs');
pup.test = function () {
  pup.log("test");
};
const islog = true;
var xpReg = /^\//;
pup.init = async function (page, argArr) {
  //导出方法 就是 前台(被控端) 传入 参数 后台对该参数数据进行操作
  //全局方法名 window.md5 或者直接md5
  await page.exposeFunction("md5", (text) => {
    //text是该方法的参数
    return cryppto.createHas("md5").updata(text).digest("hex");
    //创建的加密方法  更新的值     返回的hex的值
  });
};
pup.getSendPhone = async function () {
  let url = encodeURI("http://" + APIHOST + "/teams/getsendphone?deviceId=" + config.deviceId)
  let res = await r.get(url);
  pup.log(res);
  return JSON.parse(res).data;
}
/**
 * 得到一个两数之间的随机数可取小数  含最大值，含最小值
 * @max 最大随机数
 * @min 最小随机数
 * @last 取多少位小数 可空 不填则取整数
 */
pup.random = (min, max, last) => {
  let mo = last || null;
  min = Math.ceil(min);
  max = Math.floor(max);
  if (!mo) return Math.floor(Math.random() * (max - min + 1)) + min; //含最大值，含最小值
  return (Math.random() * (max - min + 1) + min).toFixed(mo);
};
pup.brower = async function (browerPath, argArr) {
  return new Promise((rel, rej) => {
    let browser = puppeteer.launch({
      headless: false,
      executablePath: browerPath,
      args: argArr, //'--start-maximized' //全屏`--window-size=800,800` 指定宽高
    });
    if (brower) {
      pup.log("1111");
      rel(browser);
    } else {
      rej("创建失败");
    }
  }).then(
    (rel) => {
      return rel;
    },
    (rej) => {
      pup.log(rej);
    }
  );
};
pup.page = async function (brower) {
  let page = await browser.newPage();
  return page;
};
pup.sleep = async function (delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};
/**
 *
 * @param {*} page
 * @param {*} ele DOM形式查找 #xxx .xxxx  div#xxxx div.xxxx
 * @return {*} 返回值 假 或者 ElementHandle 类型
 * page.$() = document.querySelector等待某元素出现 出现返回该元素 超时返回false  超时默认10秒
 */
pup.find = async function (page, ele) {
  let t = 0;
  let is = false;
  let result = false;
  //检索ele 是否是xPath

  if (xpReg.test(ele)) {
    result = await page.$x(ele);
    if (result[0]) {
      return result[0];
    }
  } else {
    result = await page.$(ele);
    // if (islog) pup.log(result);
    if (result) {
      return result;
    }
  }
  // pup.log(`${ele}无法找到`);
  return is;
};
/**
 *
 * @param {*} page
 * @param {*} ele DOM形式查找 #xxx .xxxx  div#xxxx div.xxxx
 * @return {*} 返回值 假 或者 ElementHandle 类型 数组
 * page.$$() = document.querySelector等待某元素出现 出现返回该元素 超时返回false  超时默认10秒
 */
pup.findAll = async function (page, ele) {
  let t = 0;
  let is = false;
  let result = false;
  //检索ele 是否是xPath
  if (xpReg.test(ele)) {
    result = await page.$x(ele);
    if (result[0]) {
      return result;
    }
  } else {
    result = await page.$$(ele);
    // if (islog) pup.log(result);
    if (result) {
      return result;
    }
  }

  return is;
};

/**
 *
 * @param {*} page
 * @param {*} ele .xxx #xxx
 * @param {*} outtime
 * page.$() 等待点击 失败返回假
 */
pup.findClick = async (page, ele) => {
  let t = 0;
  let is = false;
  let result = false;
  let isXpath = xpReg.test(ele)
  //检索ele 是否是xPath
  if (isXpath) {
    result = await page.$x(ele);
    if (result[0]) {
      if (config.log) {
        let clickname = await pup.innerHTMLbyEle(result[0]);
        console.log(`点击${clickname}`);
      }
      await result[0].click();
      return true;
    }
  } else {
    result = await page.$(ele);
    if (result) {
      if (config.log) {
        let clickname = await pup.innerHTMLbyEle(result);
        console.log(`点击${clickname}`);
      }
      await result.click();
      return true;
    }
  }
  // pup.log(`${ele}无法找到点击`);
  return is;
};

/**
 *
 * @param {*} page
 * @param {*} ele 选择器 #xxx .xxxx  div#xxxx div.xxxx 不支持XPath 可以直接获取元素显示的属性的值 例如input里面的值或者提示
 * @param {*} fun 运行的函数
 * @param {*} args 传递的参数
 * @return {*}
 * page.$eval(selector, pageFunction[, ...args]) 用于提取元素中指定值 例如 元素的文本值=>innerHTML  input=>value
 */
pup.$eval = async function (page, ele, fun, args) {
  return await page.$eval(ele, fun, args);
};
/**
 *
 * @param {*} page
 * @param {*} ele #xxx .xxxx  div#xxxx div.xxxx 匹配的所有类型 用于查找批量数据如列表 表单等 不支持XPath
 * @param {*} fun 运行的函数
 * @param {*} args 传递的参数
 * @param {*} outtime 超时 默认10000毫秒
 * @return {*} 返回值 假 或者 ElementHandle 类型
 * page.$$eval(selector, pageFunction[, ...args]) 用于提取命中的元素中指定值 例如 元素的文本值=>innerHTML  input=>value
 */
pup.$$eval = async function (page, ele, fun, args) {
  return await page.$$eval(ele, fun, args);
};

/**
 *
 * @param {*} page
 * @param {*} fun 运行的函数
 * @param {*} args 传递的参数
 * @return {*} 在运行中添加 return Promise.resolve(8 * x); 则可以获取返回值
 * page.evaluate(pageFunction[, ...args]) 直接在浏览器上下文执行一个函数
 */
pup.evalcode = async function (page, fun, args) {
  return await page.evaluate(fun, args);
};

/**
 *
 * @param {*} page 元素所在的框架或者页面
 * @param {*} ele 元素 elementHandler
 * @return {*}
 */
pup.innerHTMLbyEle = async function (page, ele) {
  return await page.evaluate((e) => { return e.innerHTML }, ele);
}
/**
 *
 * @param {*} page
 * @param {*} ele .xxx #xxx
 * @param {*} outtime 超时 默认10000毫秒
 * @return {*} 返回值 假 或者 ElementHandle 类型
 * page.$() = document.querySelector等待某元素出现 出现返回该元素 超时返回false  超时默认10秒
 */
pup.findWaite = async function (page, ele, outtime = 10000) {
  let t = 0;
  let is = false;
  let result = false;
  let isXpath = xpReg.test(ele);
  do {
    //检索ele 是否是xPath
    if (isXpath) {
      result = await page.$x(ele);
      if (result[0]) {
        return result[0];
      } else {
        await pup.sleep(1000);
        t = t + 1000;
        if (t >= outtime) {
          break;
        }
      }
    } else {
      result = await page.$(ele);
      // if (islog) pup.log(result);
      if (result) {
        return result;
      } else {
        await pup.sleep(1000);
        t = t + 1000;
        if (t >= outtime) {
          break;
        }
      }
    }
  } while (!is);
  pup.log("等待寻找超时");
  return is;
};

/**
 *
 * @param {*} page
 * @param {*} ele .xxx #xxx
 * @param {*} outtime
 * page.$() 等待点击 失败返回假 超时默认10秒
 */
pup.findWaiteClick = async (page, ele, outtime = 10000) => {
  let t = 0;
  let is = false;
  let result = false;
  let isXpath = xpReg.test(ele);
  do {
    //检索ele 是否是xPath
    if (isXpath) {
      result = await page.$x(ele);
      if (result[0]) {
        await result[0].click();
        return true;
      } else {
        await pup.sleep(1000);
        t = t + 1000;
        if (t >= outtime) {
          break;
        }
      }
    } else {
      result = await page.$(ele);
      if (result) {
        await result.click();
        return true;
      } else {
        await pup.sleep(1000);
        t = t + 1000;
        if (t >= outtime) {
          break;
        }
      }
    }
  } while (!is);
  pup.log("等待寻找点击超时");
  return is;
};

/**
 *
 * @param {*} page
 * @param {*} ele
 * @param {*} text
 * @param {*} outtime
 * 非密码返回true即填入成功
 */
pup.inputText = async (page, ele, text, ispwd = false, outtime = 10000) => {
  let t = 0;
  let is = false;
  let result = false;
  let isXpath = xpReg.test(ele);

  if (isXpath) {
    result = await page.$x(ele);
    if (result[0]) {
      await pup.inputClear(page, ele);
      await result[0].type(text);
      if (!ispwd) {
        //判断输入栏中的值是否是text
        let value = await result[0].getProperty("value");
        let val = await value.jsonValue();
        pup.log(`输入的值${text},现在设置的值:${val}`);
        if (val.indexOf(text) != -1) {
          return true;
        }
      } else {
        return true
      }

    }
  } else {
    result = await page.$(ele);
    if (result) {
      await pup.inputClear(page, ele);
      await result.type(text);
      if (!ispwd) {        //判断输入栏中的值是否是text
        let value = await result.getProperty("value");
        let val = await value.jsonValue();
        pup.log(`输入的值${text},现在设置的值:${val}`);
        if (val.indexOf(text) != -1) {
          return true;
        }
      } else {
        return true
      }

    }
  }
  pup.log("超时无法找到输入栏");
  return is;
};
/**
 *
 * @param {*} page
 * @param {*} ele
 *
 */
pup.inputClear = async (page, ele, time = 99) => {
  let t = 0;
  let is = false;
  let result = false;
  let isXpath = xpReg.test(ele);
  if (isXpath) {
    result = await page.$x(ele);

    if (result[0]) {
      for (let i = 0; i < time; i++) {
        await result[0].press("Backspace");
        //检查元素中的值是否为空
        let value = await result[0].getProperty("value");
        let val = await value.jsonValue();
        if (val == "") {
          return true;
        }
      }
    }
  } else {
    result = await page.$(ele);

    if (result) {
      for (let i = 0; i < time; i++) {
        await result.press("Backspace");
        //检查元素中的值是否为空
        let value = await result.getProperty("value");
        let val = await value.jsonValue();
        if (val == "") {
          return true;
        }
      }
    }
  }

  return is;
};
pup.inputGetVale = async function (ele) {
  let vT = await ele.getProperty('value')
  let v = await vT.jsonValue();
  return v
}
pup.eleGetPropertie = async function (ele, key) {
  if (ele) {
    const properties = await ele.getProperties();
    if (properties) {
      const children = [];
      for (const property of properties.values()) {
        const element = property.asElement();
        if (element)
          children.push(element);
      }
      pup.log(children);
      return
    }
  }
  pup.log("遍历属性,元素不存在");
}
pup.eleGetAllProperties = async function (ele) {
  if (ele) {
    const properties = await ele.getProperties();
    if (properties) {
      const children = [];
      for (const property of properties.values()) {
        const element = property.asElement();
        if (element)
          children.push(element);
      }
      pup.log(children);
      return
    }
  }
  pup.log("遍历属性,元素不存在");
}
pup.randomStr = async function (len) {
  return stringRandom(len);
};
pup.exist = async (path) => {
  return new Promise((resolve, reject) => {
    fs.access(path, err => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}
pup.log = function (txt) {
  if (config.log) {
    console.log(txt)
  }
}
pup.unique = function (arr) {
  return Array.from(new Set(arr));
}
exports.pup = pup;
