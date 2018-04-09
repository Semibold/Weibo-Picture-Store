/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {getUserData, setUserData} from "../sharre/transverter.js";
import {gtracker} from "../vendor/g-tracker.js";
import {Config} from "../sharre/config.js";
import {coreAPIs} from "./boot.js";

class TabSelector {

  constructor(sdata) {
    this.sdata = sdata;
    this.parentMenuId = "bucket_switching_0";
    this.subMenuIds = [];
    this.subMenuMap = new Map();
  }

  /**
   * @public
   * @return {Object}
   */
  get syncsdata() {
    return Object.assign({_copy_: true}, this.sdata);
  }

  /**
   * @public
   * @return {Object}
   */
  get syncselectdata() {
    const {t, p} = this.gendata();
    return t[this.sdata.selectindex];
  }

  /**
   * @public
   * @return {TabSelector}
   */
  init() {
    this.createContextMenus();
    this.addContextMenuEvent();
    this.addStorageChangeEvent();
    return this;
  }

  /**
   * @private
   */
  createContextMenus() {
    chrome.contextMenus.create({
      title: "切换存储桶",
      contexts: ["browser_action"],
      id: this.parentMenuId,
    }, () => {
      if (chrome.runtime.lastError) {
        gtracker.exception({
          exDescription: chrome.runtime.lastError.message,
          exFatal: true,
        });
        return;
      }
      this.createSubMenus();
    });
  }

  /**
   * @private
   */
  createSubMenus() {
    const {p, t} = this.gendata();
    const target = t[this.sdata.selectindex];
    const index = p.findIndex(item => item === target);
    p.forEach((d, i) => {
      const sspname = chrome.i18n.getMessage(d.ssp);
      const id = chrome.contextMenus.create({
        type: "radio",
        title: d.mark ? `${sspname} - ${d.mark}` : sspname,
        checked: i === index,
        contexts: ["browser_action"],
        parentId: this.parentMenuId,
      }, () => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          return;
        }
        this.subMenuIds.push(id);
        this.subMenuMap.set(id, d);
      });
    });
  }

  /**
   * @private
   */
  addContextMenuEvent() {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (!info.wasChecked && info.checked &&
        this.subMenuMap.has(info.menuItemId)) {
        const {p, t} = this.gendata();
        const td = this.subMenuMap.get(info.menuItemId);
        const si = t.findIndex(item => item === td);
        if (si < 0 || si >= t.length) {
          gtracker.exception({
            exDescription: "TabSelector: invalid array index",
            exFatal: true,
          });
          throw new Error("Invalid array index");
        }
        this.sdata.selectindex = si;
        setUserData(this.sdata);
      }
    });
  }

  /**
   * @private
   * @return {Object}
   */
  gendata() {
    const obj = {
      p: [], // partial (valid data)
      t: [], // total
    };
    Config.ssps.forEach(x => {
      this.sdata[x].forEach(item => {
        if (!Config.inactived[x]) {
          obj.p.push(item);
        }
        obj.t.push(item);
      });
    });
    return obj;
  }

  /**
   * @private
   * @desc 有数据变更时，会重新生成菜单
   * @desc 数据同步、不同 context 下更新数据会用到
   */
  addStorageChangeEvent() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" && areaName !== "local") return;
      if (areaName === "sync" && changes[Config.synckey] &&
        changes[Config.synckey].newValue !== this.sdata[Config.synckey]) {
        this.sdata[Config.synckey] = Boolean(changes[Config.synckey].newValue);
        this.triggerStorageChanged(this.sdata, true);
      }
      if (this.sdata[Config.synckey] !== (areaName === "sync")) return;
      if (Config.sakeys.some(k => !!changes[k])) {
        getUserData(areaName === "sync").then(d => this.triggerStorageChanged(d));
      }
    });
  }

  /**
   * @private
   * @param {Object} sdata
   * @param {boolean} [sync] - 只改变了 sdata[Config.synckey] 的值
   */
  triggerStorageChanged(sdata, sync) {
    this.sdata = sdata;
    chrome.runtime.sendMessage({
      type: Config.synckey,
      sync: sync,
      data: this.syncsdata,
    });
    if (!sync) {
      this.regenerate();
    }
  }

  /**
   * @private
   * @desc 如果有菜单已打开时，销毁重新创建菜单，则已有的菜单事件将会丢失。
   *        这个情况很少见，并且没有很好的方法来处理这个问题。
   */
  regenerate() {
    const list = this.subMenuIds.map(id => new Promise((resolve, reject) => {
      chrome.contextMenus.remove(id, () => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          reject(chrome.runtime.lastError);
        }
        resolve();
      });
    }));
    Promise.all(list).then(() => {
      this.subMenuIds.length = 0;
      this.subMenuMap.clear();
      this.createSubMenus();
    });
  }

}

/**
 * @return {Promise<TabSelector>}
 */
coreAPIs.sdataPromise = getUserData().then(d => {
  return new TabSelector(d).init();
});