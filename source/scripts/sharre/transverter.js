/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Config} from "./config.js";
import {gtracker} from "../vendor/g-tracker.js";

/**
 * @param {boolean} [sync]
 * @return {"sync"|"local"}
 */
function storageType(sync) {
  if (sync) {
    return "sync";
  } else {
    return "local";
  }
}

/**
 * @param {Object} items
 * @return {Object}
 */
function decodeData(items) {
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
    [Config.synckey]: Boolean(items[Config.synckey]),
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
 * @param {boolean} [sync] - 只有在 Storage.onChanged 事件中才有用
 * @return {Promise<Object>}
 */
export async function getUserData(sync) {
  return new Promise((resolve, reject) => {
    if (typeof sync !== "boolean") {
      reject({specified: false});
      return;
    }
    const t = storageType(sync);
    const keys = sync ? [...Config.sakeys, Config.synckey] : Config.sakeys;
    chrome.storage[t].get(keys, items => {
      if (chrome.runtime.lastError) {
        gtracker.exception({
          exDescription: chrome.runtime.lastError.message,
          exFatal: true,
        });
        reject({specified: true});
        return;
      }
      resolve(decodeData(items));
    })
  }).catch(reason => {
    if (reason && reason.specified) {
      return Promise.reject(reason);
    }
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([...Config.sakeys, Config.synckey], items => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          reject({specified: false});
          return;
        }
        if (items[Config.synckey]) {
          resolve(decodeData(items));
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
        resolve(decodeData(items));
      });
    });
  });
}

/**
 * @async
 * @desc 存取 sdata 专用
 * @param {Object} sdata
 * @return {Promise<void>}
 */
export async function setUserData(sdata) {
  if (!sdata) {
    throw new Error("Wrong data structure");
  }
  const t = storageType(sdata[Config.synckey]);
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
      }
    });
  });
}