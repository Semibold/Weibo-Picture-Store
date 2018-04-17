/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {syncedSData} from "./synced-sdata.js";
import {gtracker} from "../plugin/g-tracker.js";
import {T_DATA_CHANGED, MAX_SUBMENU_LENGTH} from "../plugin/constant.js";

class MenuSelector {

    constructor(sdata) {
        this.sdata = sdata;
        this.parentMenuId = "buckets_switching_0";
        this.subMenuIds = [];
        this.subMenuMap = new Map();
    }

    /**
     * @public
     * @return {MenuSelector}
     */
    init() {
        this.genSubMenuIds();
        this.createContextMenus();
        this.addContextMenuEvent();
        return this;
    }

    /**
     * @private
     */
    genSubMenuIds() {
        for (let i = 0; i < MAX_SUBMENU_LENGTH; i++) {
            this.subMenuIds.push(`submenu_bucket_${i}`);
        }
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
            }
            this.createSubMenus();
        });
    }

    /**
     * @private
     */
    createSubMenus() {
        const list = this.subMenuIds.map(id => {
            return new Promise((resolve, reject) => {
                chrome.contextMenus.create({
                    type: "radio",
                    title: "title",
                    id: id,
                    checked: false,
                    contexts: ["browser_action"],
                    parentId: this.parentMenuId,
                    visible: false,
                }, () => {
                    resolve();
                    if (chrome.runtime.lastError) {
                        gtracker.exception({
                            exDescription: chrome.runtime.lastError.message,
                            exFatal: true,
                        });
                    }
                });
            });
        });
        Promise.all(list).then(result => this.updateSubMenus());
    }

    /**
     * @private
     * @desc 如果有菜单已打开时，此时更新菜单，则已有的菜单事件将会丢失。
     *        这个情况很少见，并且没有很好的方法来处理这个问题。
     */
    updateSubMenus() {
        const {valid, total} = syncedSData.genlist(this.sdata);
        const target = total[this.sdata.selectindex];
        const index = valid.findIndex(item => item === target);
        this.subMenuIds.forEach((id, i) => {
            const d = valid[i];
            const o = {title: "title", checked: false, visible: false};
            if (d) {
                const sspname = chrome.i18n.getMessage(d.ssp);
                o.title = d.mark ? `${sspname} - ${d.mark}` : sspname;
                o.checked = i === index;
                o.visible = true;
            }
            chrome.contextMenus.update(id, o, () => {
                if (chrome.runtime.lastError) {
                    gtracker.exception({
                        exDescription: chrome.runtime.lastError.message,
                        exFatal: true,
                    });
                    return;
                }
                if (d) {
                    this.subMenuMap.set(id, d);
                }
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
                const {total} = syncedSData.genlist(this.sdata);
                const td = this.subMenuMap.get(info.menuItemId);
                const si = total.findIndex(item => item === td);
                if (si < 0 || si >= total.length) {
                    gtracker.exception({
                        exDescription: "MenuSelector: invalid selectindex",
                        exFatal: true,
                    });
                    throw new Error("Invalid selectindex");
                }
                this.sdata.selectindex = si;
                syncedSData.sdata = this.sdata;
            }
        });
    }

    /**
     * @public
     * @param {Object} sdata
     */
    redispatch(sdata) {
        this.sdata = sdata;
        this.updateSubMenus();
    }

}

syncedSData.promise.then(sdata => {
    const menuSelector = new MenuSelector(sdata).init();
    syncedSData.addEventListener(T_DATA_CHANGED, e => {
        if (e.detail && e.detail.sdata) {
            menuSelector.redispatch(e.detail.sdata);
        }
    });
});