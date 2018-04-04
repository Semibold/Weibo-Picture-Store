/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {i18nLocaleTexts, i18nLocaleAttrs} from "./sharre/i18n-locale.js";
import {Config} from "./sharre/config.js";

i18nLocaleTexts();
i18nLocaleAttrs();

class UserData {

  /**
   * @see /test/structs/userdata.js
   */
  constructor(sdata) {
    this.list = [];
    this.sdata = sdata;
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
    this.genlist();
    this.locales();
    this.renderSync();
    this.renderTabs();
    this.renderSelectedTab();
    this.addSyncEvent();
    this.addTabsEvent();
    this.addBtnsEvent();
    return this;
  }

  /**
   * @private
   */
  genlist() {
    Config.sspt.forEach(x => {
      if (this.sdata[x] && this.sdata[x].length) {
        this.sdata[x].forEach(item => this.list.push(Object.assign(item, {sspt: x})));
      } else {
        throw new Error("Wrong data structure");
      }
    });
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
    input.checked = this.sdata.headroom.syncdata;
  }

  /**
   * @private
   */
  renderTabs() {
    const f = new DocumentFragment();
    const dt = this.tabfragment.cloneNode(true);
    Object.assign(this.dtnodes, {
      weibo_com: dt.querySelector(`nav[data-sspt="weibo_com"]`),
      tencent_com: dt.querySelector(`nav[data-sspt="tencent_com"]`),
      qiniu_com: dt.querySelector(`nav[data-sspt="qiniu_com"]`),
      aliyun_com: dt.querySelector(`nav[data-sspt="aliyun_com"]`),
      upyun_com: dt.querySelector(`nav[data-sspt="upyun_com"]`),
    });
    f.append(dt);
    Config.sspt.forEach(x => this.generateTabs(x));
    this.ssptab.append(f);
  }

  /**
   * @private
   */
  generateTabs(x) {
    const fd = this.sdata[x][0];
    this.nodemap.set(this.dtnodes[x], fd);
    if (fd.predefine && fd.predefine.selectbtn.disabled) {
      this.dtnodes[x].hidden = true;
    }
    const tf = new DocumentFragment();
    const tn = this.tabfragment.querySelector(`nav[data-sspt="${x}"]`);
    for (let i = 1; i < this.sdata[x].length; i++) {
      const node = tn.cloneNode(true);
      if (fd.predefine && fd.predefine.selectbtn.disabled) {
        node.hidden = true;
      } else {
        this.nodemap.set(node, this.sdata[x][i]);
      }
      tf.append(node);
    }

    // noinspection JSUnresolvedFunction
    this.dtnodes[x].after(tf);
  }

  /**
   * @private
   */
  renderSelectedTab(index = 0) {
    const tabs = this.ssptab.querySelectorAll("nav[data-sspt]");
    if (index < 0 || index >= this.list.length) {
      index = 0;
    } else {
      const fd = this.sdata[this.list[index].sspt][0];
      if (fd.predefine && fd.predefine.selectbtn.disabled) {
        index = 0;
      }
    }
    for (const tab of tabs) {
      tab.dataset.selected = false;
    }
    tabs[index].dataset.selected = true;
    this.renderSelectedConfig(index);
  }

  /**
   * @private
   */
  renderSelectedConfig(index) {
    const i = this.sdata.headroom.selectindex || index;
    const d = this.list[i];
    const app = document.querySelector("#app");
    if (d.predefine) {
      const updatebtn = document.querySelector(".options-btn-update");
      const saveasbtn = document.querySelector(".options-btn-saveas");
      const deletebtn = document.querySelector(".options-btn-delete");
      updatebtn.disabled = d.predefine.updatebtn.disabled;
      saveasbtn.disabled = d.predefine.saveasbtn.disabled;
      deletebtn.disabled = d.predefine.deletebtn.disabled;
    }
    switch (d.sspt) {
      case "weibo_com":
      case "tencent_com":
      case "qiniu_com":
      case "aliyun_com":
      case "upyun_com":
        this[d.sspt](d);
        app.setAttribute("data-selected-sspt", d.sspt);
        break;
    }
  }

  /**
   * @private
   * @see sspt
   */
  weibo_com(d) {
    const input = this.ddnodes.weibo_com.querySelector(".input-microalbum-id");
    input.value = Config.microAlbumId;
  }

  /**
   * @private
   * @see sspt
   */
  tencent_com(d) {
    const mark = this.ddnodes.tencent_com.querySelector(".input-mark");
    const akey = this.ddnodes.tencent_com.querySelector(".input-akey");
    const skey = this.ddnodes.tencent_com.querySelector(".input-skey");
    const host = this.ddnodes.tencent_com.querySelector(".input-host");
    const path = this.ddnodes.tencent_com.querySelector(".input-path");
    mark.value = d.mark;
    akey.value = d.akey;
    skey.value = d.skey;
    host.value = d.host;
    path.value = d.path;
  }

  /**
   * @private
   * @see sspt
   */
  qiniu_com(d) {}

  /**
   * @private
   * @see sspt
   */
  aliyun_com(d) {}

  /**
   * @private
   * @see sspt
   */
  upyun_com(d) {}

  /**
   * @private
   */
  addSyncEvent() {}

  /**
   * @private
   */
  addTabsEvent() {
    this.ssptab.addEventListener("click", e => {
      const tab = e.target.closest("nav[data-sspt]");
      if (this.nodemap.has(tab)) {
        const d = this.nodemap.get(tab);
        const i = this.list.findIndex(cv => cv === d);
        this.renderSelectedTab(i);
      }
    });
  }

  /**
   * @private
   */
  addBtnsEvent() {}

}
