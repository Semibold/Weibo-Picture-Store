/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {syncedSData} from "./synced-sdata.js";
import {gtracker} from "../plugin/g-tracker.js";
import {T_DATA_CHANGED} from "../plugin/constant.js";

class MenuSelector {

    constructor(sdata) {
        this.sdata = sdata;
        this.parentMenuId = "bucket_switching_0";
        this.subMenuIds = [];
        this.subMenuMap = new Map();
    }

    /**
     * @public
     * @return {MenuSelector}
     */
    init() {
        this.createContextMenus();
        this.addContextMenuEvent();
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
        const {valid, total} = syncedSData.genlist();
        const target = total[this.sdata.selectindex];
        const index = valid.findIndex(item => item === target);
        valid.forEach((d, i) => {
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
                const {total} = syncedSData.genlist();
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
                    return;
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

    /**
     * @public
     * @param {Object} sdata
     * @param {boolean} [syncOnly] - 只改变了 sdata[Config.synckey] 的值
     */
    redispatch(sdata, syncOnly) {
        this.sdata = sdata;
        if (!syncOnly) {
            this.regenerate();
        }
    }

}

syncedSData.promise.then(sdata => {
    const menuSelector = new MenuSelector(sdata).init();
    syncedSData.addEventListener(T_DATA_CHANGED, e => {
        if (e.detail) {
            menuSelector.redispatch(e.detail.sdata, e.detail.syncOnly);
        }
    });
});