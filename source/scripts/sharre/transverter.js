/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Config} from "./config.js";

class PartialHander {

  /**
   * @param {boolean} syncdata
   * @return {"sync"|"local"}
   */
  static storageType(syncdata) {
    return syncdata ? "sync" : "local";
  }

  /**
   * @param {Object} items
   * @return {Object}
   */
  static decodeData(items) {
    const l = [];
    const z = Config.sspt.reduce((r, x) => {
      const pl = l.length;
      const a = Array.isArray(items[x]) ? items[x] : [];
      if (!a.length) a.push(Config.ssptdata[x]);
      r[x] = a;
      l.push(...a);

      // 配置锁定可能会让之前的 selectindex 数据无效
      if (r.selectindex >= pl && r.selectindex < l.length) {
        if (Config.inactived[x]) {
          r.selectindex = Config.selectindex;
        }
      }

      return r;
    }, {
      selectindex: items.selectindex || Config.selectindex,
      syncdata: items.syncdata || Config.syncdata,
    });

    // selectindex 超出数据长度重置为默认
    if (z.selectindex >= l.length) {
      z.selectindex = Config.selectindex;
    }

    return z;
  }

  /**
   * @param {Object} sdata
   * @return {Object}
   */
  static encodeData(sdata) {
    const r = {
      selectindex: sdata.selectindex,
      syncdata: sdata.syncdata,
    };
    Config.sspt.forEach(x => {
      const validkeys = Object.keys(Config.ssptdata[x]);

      // 如果某个 SSPT 被禁用则不存储其数据，已有数据也会被丢弃
      if (Config.inactived[x]) return;

      r[x] = sdata[x].map(item => validkeys.reduce((ac, k) => {
        ac[k] = item[k] || Config.ssptdata[x][k]; return ac;
      }, {}));
    });
    return r;
  }

}


/**
 * @async
 * @param {boolean} [sync]
 * @return {Promise<Object>}
 */
export async function getUserData(sync) {
  const synckey = "syncdata";
  const selectkey = "selectindex";
  return new Promise((resolve, reject) => {
    if (sync != null) {
      resolve(PartialHander.storageType(sync));
      return;
    }
    chrome.storage.sync.get([synckey], items => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(PartialHander.storageType(items[synckey]));
    });
  }).then(t => {
    return new Promise((resolve, reject) => {
      chrome.storage[t].get([synckey, selectkey, ...Config.sspt], items => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(PartialHander.decodeData(items));
      });
    });
  });
}

/**
 * @async
 * @param {Object} sdata
 * @return {Promise<void>}
 */
export async function setUserData(sdata) {
  if (!sdata) {
    throw new Error("Wrong data structure");
  }
  const t = PartialHander.storageType(sdata.syncdata);
  return new Promise((resolve, reject) => {
    chrome.storage[t].set(PartialHander.encodeData(sdata), () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else{
        resolve();
      }
    });
  });
}