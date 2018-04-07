/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {i18nLocaleTexts, i18nLocaleAttrs} from "./sharre/i18n-locale.js";
import {Config} from "./sharre/config.js";
import {setUserData} from "./sharre/transverter.js";
import {tracker} from "./sharre/tracker.js";

i18nLocaleTexts();
i18nLocaleAttrs();
tracker.pageview();

const bws = chrome.extension.getBackgroundPage();

class UserData {

  /**
   * @see /test/structs/userdata.js
   */
  constructor(sdata) {
    this.sdata = sdata;
    this.list = [];
    this.nodemap = new WeakMap();
    this.ssptab = document.querySelector(".options-ssptab");
    this.ssptabtpl = document.querySelector("#options-ssptab-template");
    this.tabfragment = document.importNode(this.ssptabtpl.content, true);
    this.dtnodes = {
      weibo_com: null,
      tencent_com: null,
      qiniu_com: null,
      aliyun_com: null,
      upyun_com: null,
    };
    this.ddnodes = {
      weibo_com: document.querySelector(`.options-userdata[data-sspt="weibo_com"]`),
      tencent_com: document.querySelector(`.options-userdata[data-sspt="tencent_com"]`),
      qiniu_com: document.querySelector(`.options-userdata[data-sspt="qiniu_com"]`),
      aliyun_com: document.querySelector(`.options-userdata[data-sspt="aliyun_com"]`),
      upyun_com: document.querySelector(`.options-userdata[data-sspt="upyun_com"]`),
    };
  }

  /**
   * @public
   * @return {UserData}
   */
  init() {
    this.locales();
    this.genlist();
    this.renderSync();
    this.renderSelectedTab();
    this.addSyncEvent();
    this.addTabsEvent();
    this.addBtnsEvent();
    return this;
  }

  /**
   * @private
   * @desc 数据有新增、删除时，这个列表需要重新生成
   */
  genlist() {
    this.list.length = 0;
    Config.sspt.forEach(x => {
      if (this.sdata[x] && this.sdata[x].length) {
        this.sdata[x].forEach((item, i) => {
          const foreign = i === 0 ? Config.predefine[x] : Config.furtherer;
          this.list.push(Object.assign(item, {foreign}));
        });
      } else {
        tracker.exception({
          exDescription: "Options: wrong data structure",
          exFatal: true,
        });
        throw new Error("Wrong data structure");
      }
    });
    this.renderTabs();
  }

  /**
   * @private
   */
  locales() {
    i18nLocaleTexts(this.tabfragment);
    i18nLocaleAttrs(this.tabfragment);
  }

  /**
   * @private
   */
  renderSync() {
    const input = document.querySelector(".input-syncdata");
    input.checked = this.sdata.syncdata;
  }

  /**
   * @private
   */
  renderTabs() {
    const f = new DocumentFragment();
    const dt = this.tabfragment.cloneNode(true);
    const tabs = this.ssptab.querySelectorAll(`nav[data-sspt]`);
    Object.assign(this.dtnodes, {
      weibo_com: dt.querySelector(`nav[data-sspt="weibo_com"]`),
      tencent_com: dt.querySelector(`nav[data-sspt="tencent_com"]`),
      qiniu_com: dt.querySelector(`nav[data-sspt="qiniu_com"]`),
      aliyun_com: dt.querySelector(`nav[data-sspt="aliyun_com"]`),
      upyun_com: dt.querySelector(`nav[data-sspt="upyun_com"]`),
    });
    f.append(dt);
    Config.sspt.forEach(x => this.generateTabs(x));
    for (const tab of tabs) tab.remove();
    this.ssptab.append(f);
  }

  /**
   * @private
   * @param {string} x - sspt
   */
  generateTabs(x) {
    const d0 = this.sdata[x][0];
    this.nodemap.set(this.dtnodes[x], d0);
    this.renderRemark(this.dtnodes[x]);
    if (Config.inactived[x]) {
      this.dtnodes[x].hidden = true;
    }
    const tf = new DocumentFragment();
    const tn = this.tabfragment.querySelector(`nav[data-sspt="${x}"]`);
    for (let i = 1; i < this.sdata[x].length; i++) {
      const node = tn.cloneNode(true);
      if (Config.inactived[x]) {
        node.hidden = true;
      } else {
        this.nodemap.set(node, this.sdata[x][i]);
        this.renderRemark(node);
      }
      tf.append(node);
    }

    // noinspection JSUnresolvedFunction
    this.dtnodes[x].after(tf);
  }

  /**
   * @private
   * @param {Element} node
   */
  renderRemark(node) {
    if (this.nodemap.has(node)) {
      const d = this.nodemap.get(node);
      const cnode = node.querySelector("nav[data-sspt] > span:nth-of-type(2)");
      const ctext = cnode.textContent.split("-").shift().trim();
      cnode.textContent = d.mark ? `${ctext} - ${d.mark}` : ctext;
    }
  }

  /**
   * @private
   * @param {number} [index]
   */
  renderSelectedTab(index) {
    const tabs = this.ssptab.querySelectorAll("nav[data-sspt]");
    if (index == null) {
      index = this.sdata.selectindex || Config.selectindex;
    }
    if (index < 0) return;
    if (index >= this.list.length) {
      tracker.exception({
        exDescription: "Options: overflowed array index",
        exFatal: true,
      });
      throw new Error(`Invalid index: ${index}`);
    }
    for (const tab of tabs) {
      tab.dataset.selected = false;
    }
    tabs[index].dataset.selected = true;
    tabs[index].scrollIntoView({block: "nearest", inline: "nearest"});
    this.renderSelectedConfig(index);
    if (this.sdata.selectindex !== index) {
      this.sdata.selectindex = index;
      setUserData(this.sdata);
    }
  }

  /**
   * @private
   * @param {number} i
   */
  renderSelectedConfig(i) {
    const d = this.list[i];
    const app = document.querySelector("#app");
    const updatebtn = document.querySelector(".options-btn-update");
    const saveasbtn = document.querySelector(".options-btn-saveas");
    const deletebtn = document.querySelector(".options-btn-delete");
    updatebtn.disabled = d.foreign.updatebtn.disabled;
    saveasbtn.disabled = d.foreign.saveasbtn.disabled;
    deletebtn.disabled = d.foreign.deletebtn.disabled;
    this[d.sspt](d, "render");
    app.setAttribute("data-selected-sspt", d.sspt);
  }

  /**
   * @private
   * @see sspt
   * @enum role = "render" | "update"
   */
  weibo_com(d, role) {
    const input = this.ddnodes.weibo_com.querySelector(".input-microalbum-id");
    input.value = Config.microAlbumId;
  }

  /**
   * @private
   * @see sspt
   */
  tencent_com(d, role) {
    const mark = this.ddnodes.tencent_com.querySelector(".input-mark");
    const akey = this.ddnodes.tencent_com.querySelector(".input-akey");
    const skey = this.ddnodes.tencent_com.querySelector(".input-skey");
    const host = this.ddnodes.tencent_com.querySelector(".input-host");
    const path = this.ddnodes.tencent_com.querySelector(".input-path");
    switch (role) {
      case "render":
        mark.value = d.mark;
        akey.value = d.akey;
        skey.value = d.skey;
        host.value = d.host;
        path.value = d.path;
        break;
      case "update":
        d.mark = mark.value.trim();
        d.akey = akey.value.trim();
        d.skey = skey.value.trim();
        d.host = host.value.trim();
        d.path = path.value.trim();
        break;
    }
  }

  /**
   * @private
   * @see sspt
   */
  qiniu_com(d, role) {}

  /**
   * @private
   * @see sspt
   */
  aliyun_com(d, role) {}

  /**
   * @private
   * @see sspt
   */
  upyun_com(d, role) {}

  /**
   * @private
   */
  addSyncEvent() {
    const input = document.querySelector(".input-syncdata");
    input.addEventListener("click", e => {
      this.sdata.syncdata = input.checked;
      setUserData(this.sdata);
      tracker.event({
        eventCategory: e.target.tagName,
        eventAction: e.type,
        eventLabel: "options_sync_data",
      });
    });
  }

  /**
   * @private
   */
  addTabsEvent() {
    this.ssptab.addEventListener("click", e => {
      const tab = e.target.closest("nav[data-sspt]");
      if (this.nodemap.has(tab)) {
        const d = this.nodemap.get(tab);
        if (Config.inactived[d.sspt]) return;
        const i = this.list.findIndex(cv => cv === d);
        this.renderSelectedTab(i);
        tracker.event({
          eventCategory: e.target.tagName,
          eventAction: e.type,
          eventLabel: "options_tabmenu_switching",
        });
      }
    });
  }

  /**
   * @private
   */
  addBtnsEvent() {
    const updatebtn = document.querySelector(".options-btn-update");
    const saveasbtn = document.querySelector(".options-btn-saveas");
    const deletebtn = document.querySelector(".options-btn-delete");
    updatebtn.addEventListener("click", e => {
      // @todo 验证数据
      const cd = this.list[this.sdata.selectindex];
      if (cd.foreign.updatebtn.disabled) return;
      this[cd.sspt](cd, "update");
      this.renderRemark(this.ssptab.querySelector(`nav[data-selected="true"]`));
      setUserData(this.sdata);
      tracker.event({
        eventCategory: e.target.tagName,
        eventAction: e.type,
        eventLabel: "options_update_button",
      });
    });
    saveasbtn.addEventListener("click", e => {
      // @todo 验证数据
      const cd = this.list[this.sdata.selectindex];
      if (cd.foreign.saveasbtn.disabled) return;
      const al = this.activatedlist();
      if (al.length >= Config.listmaxlength) {
        // @todo 超出最大条目提示
        return;
      }
      const nd = Config.ssptdata[cd.sspt];
      this.sdata[cd.sspt].push(nd);
      this[cd.sspt](nd, "update");
      this.genlist();
      const index = this.list.findIndex(cv => cv === nd);
      this.renderSelectedTab(index);
      setUserData(this.sdata);
      tracker.event({
        eventCategory: e.target.tagName,
        eventAction: e.type,
        eventLabel: "options_saveas_button",
      });
    });
    deletebtn.addEventListener("click", e => {
      const cd = this.list[this.sdata.selectindex];
      if (cd.foreign.deletebtn.disabled) return;
      const index = this.sdata[cd.sspt].findIndex(cv => cv === cd);
      this.sdata[cd.sspt].splice(index, 1);
      this.genlist();
      for (let i = this.sdata.selectindex - 1; i >=0 ; i--) {
        const ld = this.list[i];
        if (Config.inactived[ld.sspt]) continue;
        this.renderSelectedTab(i);
        break;
      }
      setUserData(this.sdata);
      tracker.event({
        eventCategory: e.target.tagName,
        eventAction: e.type,
        eventLabel: "options_delete_button",
      });
    });
  }

  /**
   * @private
   */
  activatedlist() {
    return this.list.filter(item => !Config.inactived[item.sspt]);
  }

}

bws.SharreM.sdataPromise.then(ts => {
  new UserData(ts.timelysdata).init();
});