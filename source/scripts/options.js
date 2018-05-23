/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {i18nLocale} from "./sharre/i18n-locale.js";
import {Config} from "./sharre/config.js";
import {SharreM} from "./sharre/alphabet.js";
import {T_DATA_CHANGED, FEATURE_ID, MAX_SUBMENU_LENGTH} from "./sharre/constant.js";
import {Utils} from "./sharre/utils.js";

import {gtracker} from "./plugin/g-tracker.js";

gtracker.pageview();

class OptionsTree {

    constructor(sdata) {
        this.sdata = sdata;
        this.total = [];
        this.valid = [];
        this.nodemap = new WeakMap();
        this.notifyId = Utils.randomString(16);
        this.ssptab = document.querySelector(".options-ssptab");
        this.ssptabtpl = document.querySelector("#options-ssptab-template");
        this.tabfragment = document.importNode(this.ssptabtpl.content, true);
        this.dtnodes = {
            weibo_com: null,
            qcloud_com: null,
            qiniu_com: null,
            aliyun_com: null,
            upyun_com: null,
        };
        this.ddnodes = {
            weibo_com: document.querySelector(`.options-userdata[data-ssp="weibo_com"]`),
            qcloud_com: document.querySelector(`.options-userdata[data-ssp="qcloud_com"]`),
            qiniu_com: document.querySelector(`.options-userdata[data-ssp="qiniu_com"]`),
            aliyun_com: document.querySelector(`.options-userdata[data-ssp="aliyun_com"]`),
            upyun_com: document.querySelector(`.options-userdata[data-ssp="upyun_com"]`),
        };
    }

    /**
     * @public
     * @return {OptionsTree}
     */
    init() {
        this.locales();
        this.genlist();
        this.renderSync();
        this.renderTabs();
        this.renderSelectedTab();
        this.addTabsEvent();
        this.addBtnsEvent();
        return this;
    }

    /**
     * @public
     * @param {Object} sdata
     */
    rerenderSync(sdata) {
        this.sdata = sdata;
        this.renderSync();
    }

    /**
     * @public
     * @param {Object} sdata
     */
    redispatch(sdata) {
        this.sdata = sdata;
        this.genlist();
        this.renderSync();
        this.renderTabs();
        this.renderSelectedTab();
    }

    /**
     * @private
     * @desc 数据有新增、删除时，这个列表需要重新生成
     */
    genlist() {
        const {valid, total} = SharreM.syncedSData.genlist(this.sdata);
        this.valid = valid;
        this.total = total;
    }

    /**
     * @private
     */
    locales() {
        i18nLocale(this.tabfragment);
    }

    /**
     * @private
     */
    renderSync() {
        const input = document.querySelector(".input-syncdata");
        input.checked = this.sdata[Config.synckey];
    }

    /**
     * @private
     */
    renderTabs() {
        const f = new DocumentFragment();
        const dt = this.tabfragment.cloneNode(true);
        const tabs = this.ssptab.querySelectorAll(`nav[data-ssp]`);
        Object.assign(this.dtnodes, {
            weibo_com: dt.querySelector(`nav[data-ssp="weibo_com"]`),
            qcloud_com: dt.querySelector(`nav[data-ssp="qcloud_com"]`),
            qiniu_com: dt.querySelector(`nav[data-ssp="qiniu_com"]`),
            aliyun_com: dt.querySelector(`nav[data-ssp="aliyun_com"]`),
            upyun_com: dt.querySelector(`nav[data-ssp="upyun_com"]`),
        });
        f.append(dt);
        Config.ssps.forEach(x => this.generateTabs(x));
        for (const tab of tabs) tab.remove();
        this.ssptab.append(f);
    }

    /**
     * @private
     * @param {string} x - ssp
     */
    generateTabs(x) {
        const fd = this.sdata[x][0];
        this.nodemap.set(this.dtnodes[x], fd);
        this.renderRemark(this.dtnodes[x]);
        if (Config.inactived[x]) {
            this.dtnodes[x].hidden = true;
        }
        const tf = new DocumentFragment();
        const tn = this.tabfragment.querySelector(`nav[data-ssp="${x}"]`);
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
            const cnode = node.querySelector("nav[data-ssp] > span:nth-of-type(2)");
            const ctext = chrome.i18n.getMessage(cnode.dataset.i18n);
            cnode.textContent = d.mark ? `${ctext} - ${d.mark}` : ctext;
        }
    }

    /**
     * @private
     * @param {number} [index]
     */
    renderSelectedTab(index) {
        const tabs = this.ssptab.querySelectorAll("nav[data-ssp]");
        if (index == null) {
            index = this.sdata.selectindex || Config.selectindex;
        }
        if (index < 0) return;
        if (index >= this.total.length) {
            gtracker.exception({
                exDescription: "OptionsTree: overflowed array index",
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
    }

    /**
     * @private
     * @param {number} i
     */
    renderSelectedConfig(i) {
        const d = this.total[i];
        const app = document.querySelector("#app");
        const updatebtn = document.querySelector(".options-btn-update");
        const saveasbtn = document.querySelector(".options-btn-saveas");
        const deletebtn = document.querySelector(".options-btn-delete");
        updatebtn.disabled = d.foreign.updatebtn.disabled;
        saveasbtn.disabled = d.foreign.saveasbtn.disabled;
        deletebtn.disabled = d.foreign.deletebtn.disabled;
        this[d.ssp](d, "render");
        app.setAttribute("data-selected-ssp", d.ssp);
    }

    /**
     * @private
     * @see ssp
     * @enum role = "render" | "update"
     */
    weibo_com(d, role) {
        const input = this.ddnodes.weibo_com.querySelector(".input-microalbum-id");
        input.value = FEATURE_ID;
    }

    /**
     * @private
     * @see ssp
     */
    qcloud_com(d, role) {
        const mark = this.ddnodes.qcloud_com.querySelector(".input-mark");
        const akey = this.ddnodes.qcloud_com.querySelector(".input-akey");
        const skey = this.ddnodes.qcloud_com.querySelector(".input-skey");
        const host = this.ddnodes.qcloud_com.querySelector(".input-host");
        const path = this.ddnodes.qcloud_com.querySelector(".input-path");
        const pics = this.ddnodes.qcloud_com.querySelector(".input-pics");
        switch (role) {
            case "render":
                mark.value = d.mark;
                akey.value = d.akey;
                skey.value = d.skey;
                host.value = d.host;
                path.value = d.path;
                pics.value = d.pics;
                break;
            case "update":
                d.mark = mark.value.trim();
                d.akey = akey.value.trim();
                d.skey = skey.value.trim();
                d.host = host.value.trim();
                d.path = Utils.formatDirpath(path.value);
                d.pics = pics.value.trim();
                break;
        }
    }

    /**
     * @private
     * @see ssp
     */
    qiniu_com(d, role) {}

    /**
     * @private
     * @see ssp
     */
    aliyun_com(d, role) {}

    /**
     * @private
     * @see ssp
     */
    upyun_com(d, role) {}

    /**
     * @private
     * @desc 同步已经禁用
     */
    addSyncEvent() {
        const input = document.querySelector(".input-syncdata");
        input.addEventListener("click", e => {
            this.sdata[Config.synckey] = input.checked;
            chrome.storage.sync.set({
                [Config.synckey]: input.checked,
            }, () => {
                if (chrome.runtime.lastError) {
                    gtracker.exception({
                        exDescription: chrome.runtime.lastError.message,
                        exFatal: true,
                    });
                    return;
                }
                SharreM.syncedSData.sdata = this.sdata;
            });
            gtracker.event({
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
            const tab = e.target.closest("nav[data-ssp]");
            if (this.nodemap.has(tab)) {
                const d = this.nodemap.get(tab);
                if (Config.inactived[d.ssp]) return;
                const i = this.total.findIndex(cv => cv === d);
                if (i >= 0 && i < this.total.length &&
                    this.sdata.selectindex !== i) {
                    this.sdata.selectindex = i;
                    SharreM.syncedSData.sdata = this.sdata;
                } else {
                    this.renderSelectedTab(i);
                }
                gtracker.event({
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
            const cd = this.total[this.sdata.selectindex];
            if (cd.foreign.updatebtn.disabled) return;
            this[cd.ssp](cd, "update");
            SharreM.syncedSData.sdata = this.sdata;
            SharreM.ActionCheck.fetcher(cd.ssp, {[cd.ssp]: cd});
            gtracker.event({
                eventCategory: e.target.tagName,
                eventAction: e.type,
                eventLabel: "options_update_button",
            });
        });
        saveasbtn.addEventListener("click", e => {
            const cd = this.total[this.sdata.selectindex];
            if (cd.foreign.saveasbtn.disabled) return;
            if (this.valid.length >= MAX_SUBMENU_LENGTH) {
                chrome.notifications.create(this.notifyId, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("notify_icon"),
                    title: chrome.i18n.getMessage("warn_title"),
                    message: "已经达到列表上限了，无法创建新的列表呦~",
                });
                return;
            }
            const nd = Config.sspsdata[cd.ssp];
            this.sdata[cd.ssp].push(nd);
            this[cd.ssp](nd, "update");
            this.genlist();
            this.sdata.selectindex = this.total.findIndex(cv => cv === nd);
            SharreM.syncedSData.sdata = this.sdata;
            SharreM.ActionCheck.fetcher(nd.ssp, {[nd.ssp]: nd});
            gtracker.event({
                eventCategory: e.target.tagName,
                eventAction: e.type,
                eventLabel: "options_saveas_button",
            });
        });
        deletebtn.addEventListener("click", e => {
            const cd = this.total[this.sdata.selectindex];
            if (cd.foreign.deletebtn.disabled) return;
            const index = this.sdata[cd.ssp].findIndex(cv => cv === cd);
            this.sdata[cd.ssp].splice(index, 1);
            this.genlist();
            for (let i = this.sdata.selectindex - 1; i >= 0; i--) {
                const ld = this.total[i];
                if (Config.inactived[ld.ssp]) continue;
                this.sdata.selectindex = i;
                break;
            }
            SharreM.syncedSData.sdata = this.sdata;
            gtracker.event({
                eventCategory: e.target.tagName,
                eventAction: e.type,
                eventLabel: "options_delete_button",
            });
        });
    }

}

SharreM.syncedSData.promise.then(sdata => {
    const optionsTree = new OptionsTree(sdata).init();
    chrome.runtime.onMessage.addListener(message => {
        if (message.type === T_DATA_CHANGED && message.sdata) {
            optionsTree.redispatch(message.sdata);
        }
    });
});