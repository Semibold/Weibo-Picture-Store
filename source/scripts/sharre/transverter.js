/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Config} from "./config.js";
import {gtracker} from "../vendor/g-tracker.js";

/**
 * @param {boolean} [sync]
 * @return {["sync", "local"]|["local", "sync"]}
 */
function storageType(sync) {
  return sync ? ["sync", "local"] : ["local", "sync"];
}

/**
 * @param {"sync"|"local"} areaName
 * @return {boolean}
 */
function syncStorage(areaName) {
  if (areaName === "sync") {
    return true;
  }
  if (areaName === "local") {
    return false;
  }
  throw new Error("Invalid storage area name");
}

/**
 * @param {Object} items
 * @param {"sync"|"local"} areaName
 * @return {Object}
 */
function decodeData(items, areaName) {
  const l = [];
  const z = Config.ssps.reduce((r, x) => {
    const pl = l.length;
    const a = Array.isArray(items[x]) ? items[x] : [];
    if (!a.length) a.push(Config.sspsdata[x]);
    r[x] = a;
    l.push(...a);

    // 配置锁定可能会让之前的 selectindex 数据无效
    if (r.selectindex >= pl && r.selectindex < l.length) {
      if (Config.inactived[x]) {
        r.selectindex = Config.selectindex;
        gtracker.exception({
          exDescription: "Transverter: expired slectindex",
          exFatal: false,
        });
      }
    }

    return r;
  }, {
    selectindex: items.selectindex || Config.selectindex,
    syncdata: syncStorage(areaName),
  });

  // selectindex 超出数据长度重置为默认
  if (z.selectindex >= l.length) {
    z.selectindex = Config.selectindex;
    gtracker.exception({
      exDescription: "Transverter: overflowed slectindex",
      exFatal: false,
    });
  }

  return z;
}

/**
 * @param {Object} sdata
 * @return {Object}
 */
function encodeData(sdata) {
  const r = {selectindex: sdata.selectindex};
  Config.ssps.forEach(x => {
    const validkeys = Object.keys(Config.sspsdata[x]);

    // 如果某个类型被禁用则不存储其数据，已有数据也会被丢弃
    if (Config.inactived[x]) return;

    r[x] = sdata[x].map(item => validkeys.reduce((ac, k) => {
      ac[k] = item[k] || Config.sspsdata[x][k];
      return ac;
    }, {}));
  });
  return r;
}


/**
 * @async
 * @desc 存取 UserData 专用
 * @param {"sync"|"local"} [areaName] - 只有在 Storage.onChanged 事件中才有用
 * @param {boolean} [preSyncState] - 只有在 Storage.onChanged 事件中才有用
 * @return {Promise<Object>}
 */
export async function getUserData(areaName, preSyncState) {
  return new Promise((resolve, reject) => {
    if (areaName === "sync" || areaName === "local") {
      chrome.storage[areaName].get(Config.sakeys, items => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          reject({specified: true});
          return;
        }
        resolve(decodeData(items, areaName));

        /**
         * @desc 同步时 areaName 发生了变化，清理旧的 areaName 中的数据
         */
        if (typeof preSyncState === "boolean") {
          const [t, r] = storageType(preSyncState);
          if (t !== areaName) {
            chrome.storage[r].remove(Config.sakeys);
          }
        }

      });
    } else {
      reject({specified: false});
    }
  }).catch(reason => {
    if (reason && reason.specified) {
      return Promise.reject(reason);
    }
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(Config.sakeys, items => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          reject({specified: false});
          return;
        }
        if (Object.keys(items).length) {
          resolve(decodeData(items, "sync"));
        } else {
          reject({specified: false});
        }
      });
    });
  }).catch(reason => {
    if (reason && reason.specified) {
      return Promise.reject(reason);
    }
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(Config.sakeys, items => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          reject({specified: false});
          return;
        }
        resolve(decodeData(items, "local"));
      });
    });
  });
}

/**
 * @async
 * @desc 存取 UserData 专用
 * @param {Object} sdata
 * @param {boolean} [areaNameChanged]
 * @return {Promise<void>}
 */
export async function setUserData(sdata, areaNameChanged) {
  if (!sdata) {
    throw new Error("Wrong data structure");
  }
  const [t, r] = storageType(sdata.syncdata);
  return new Promise((resolve, reject) => {
    chrome.storage[t].set(encodeData(sdata), () => {
      if (chrome.runtime.lastError) {
        gtracker.exception({
          exDescription: chrome.runtime.lastError.message,
          exFatal: true,
        });
        reject(chrome.runtime.lastError);
      } else {
        resolve();
        if (areaNameChanged) {
          chrome.storage[r].remove(Config.sakeys);
        }
      }
    });
  });
}