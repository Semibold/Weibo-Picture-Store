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
    this.idmap = new Map();
    this.parentMenuId = null;
    this.subMenuIds = [];
  }

  /**
   * @public
   * @return {boolean}
   */
  get syncstate() {
    return this.sdata[Config.synckey];
  }

  /**
   * @public
   * @return {string} - ssp
   */
  get ssp() {
    return this.gendata().t[this.sdata.selectindex].ssp;
  }

  /**
   * @public
   * @return {TabSelector}
   */
  init() {
    this.createMenus();
    this.addChangeEvent();
    return this;
  }

  /**
   * @private
   */
  createMenus() {
    this.parentMenuId = chrome.contextMenus.create({
      title: "切换存储桶",
      contexts: ["browser_action"],
    }, () => {
      if (chrome.runtime.lastError) {
        gtracker.exception({
          exDescription: chrome.runtime.lastError.message,
          exFatal: true,
        });
        return;
      }
      this.createRadios();
    });
  }

  /**
   * @private
   */
  createRadios() {
    const obj = this.gendata();
    const target = obj.t[this.sdata.selectindex];
    const index = obj.p.findIndex(item => item === target);
    obj.p.forEach((d, i) => {
      const sspname = chrome.i18n.getMessage(d.ssp);
      const id = chrome.contextMenus.create({
        type: "radio",
        title: d.mark ? `${sspname} - ${d.mark}` : sspname,
        checked: i === index,
        contexts: ["browser_action"],
        parentId: this.parentMenuId,
        onclick: (info, tab) => {
          if (this.idmap.has(info.menuItemId)) {
            const td = this.idmap.get(info.menuItemId);
            const si = obj.t.findIndex(item => item === td);
            if (si < 0 || si >= obj.t.length) {
              gtracker.exception({
                exDescription: "TabSelector: invalid array index",
                exFatal: true,
              });
              throw new Error("Invalid array index");
            }
            this.sdata.selectindex = si;
            setUserData(this.sdata);
          }
        },
      }, () => {
        if (chrome.runtime.lastError) {
          gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
          });
          return;
        }
        this.subMenuIds.push(id);
        this.idmap.set(id, d);
      });
    });
  }

  /**
   * @private
   * @return {Object}
   */
  gendata() {
    const obj = {
      p: [], // partial
      t: [], // total
    };
    Config.ssps.forEach(x => {
      if (this.sdata[x] && this.sdata[x].length) {
        this.sdata[x].forEach((item, i) => {
          const foreign = i === 0 ? Config.predefine[x] : Config.preothers;
          const d = Object.assign(item, {foreign});
          if (!Config.inactived[x]) obj.p.push(d);
          obj.t.push(d);
        });
      } else {
        gtracker.exception({
          exDescription: "TabSelector: wrong data structure",
          exFatal: true,
        });
        throw new Error("Wrong data structure");
      }
    });
    return obj;
  }

  /**
   * @private
   * @desc 有数据变更时，会重新生成菜单
   * @desc 数据同步、不同 context 下更新数据会用到
   */
  addChangeEvent() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" && areaName !== "local") return;
      if (areaName === "sync" && changes[Config.synckey] &&
        changes[Config.synckey].newValue !== this.sdata[Config.synckey]) {
        this.sdata[Config.synckey] = Boolean(changes[Config.synckey].newValue);
      }
      if (this.sdata[Config.synckey] !== (areaName === "sync")) return;

      // 如果是当前菜单更新了 selectindex，则不用更新当前数据
      if (changes.selectindex && Object.keys(changes).length === 1 &&
        changes.selectindex.newValue === this.sdata.selectindex) {
        return;
      }

      if (Config.sakeys.some(k => !!changes[k])) {
        getUserData(areaName === "sync").then(d => this.regenerate(d));
      }
    });
  }

  /**
   * @private
   * @desc 如果有菜单已打开时，销毁重新创建菜单，则已有的菜单事件将会丢失。
   *        这个情况很少见，并且没有很好的方法来处理这个问题。
   */
  regenerate(sdata) {
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
      this.sdata = sdata;
      this.idmap.clear();
      this.subMenuIds.length = 0;
      this.createRadios();
    });
  }

}

/**
 * @return {Promise<TabSelector>}
 */
coreAPIs.sdataPromise = getUserData().then(d => {
  return new TabSelector(d).init();
});