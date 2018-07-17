/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * WARNING: `requestAnimationFrame` has no effect on chrome background page
 */
import {Utils} from "../sharre/utils.js";
import {FP_TYPE_DOWNLOAD, FP_TYPE_UPLOAD} from "../sharre/constant.js";

const fps = 25;
const storeMap = new Map();
const nextFrame = callback => setTimeout(callback, 1000 / fps);

/**
 * @desc 用于支持多类型
 */
class TypeEntry {

    constructor(tid) {
        this.timerId = null;
        this.notifyId = Utils.randomString(16);
        this.cycle = 0;
        this.total = 0;
        this.settle = 0;
        storeMap.set(tid, this);
    }

    reformat() {
        this.total = 0;
        this.settle = 0;
    }

    consume(n) {
        if (Number.isInteger(n) && n > 0) {
            if (this.settle + n <= this.total) {
                this.settle += n;
                this.cycle = 0;
            }
        }
    }

    padding(n) {
        if (Number.isInteger(n) && n > 0) {
            this.total += n;
        }
    }

}

new TypeEntry(FP_TYPE_UPLOAD);
new TypeEntry(FP_TYPE_DOWNLOAD);

/**
 * @desc 核心实现
 * @return {boolean}
 */
function coreInternalHander(tid) {
    let dtd = storeMap.get(tid);
    let message;
    let contextMessage;

    if (dtd.settle === dtd.total) {
        return false;
    }

    switch (tid) {
        case FP_TYPE_UPLOAD:
            message = "当前提示在上传完成后会自动关闭";
            contextMessage = "加速上传中，请耐心等候";
            break;
        case FP_TYPE_DOWNLOAD:
            message = "当前提示在下载完成后会自动关闭";
            contextMessage = "正在获取远程文件，请耐心等候";
            break;
        default:
            return false;
    }

    function loop() {
        const avr = 3;    // 3s
        const hat = 5;    // 5-90-5
        const gap = (100 - hat * 2) / dtd.total;
        const step = gap / avr / fps;
        const next = Math.floor(hat + dtd.settle * gap + Math.min(++dtd.cycle, avr * fps) * step);
        chrome.notifications.create(dtd.notifyId, {
            type: "progress",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: message,
            contextMessage: contextMessage,
            progress: Math.max(0, Math.min(100, next)),
            requireInteraction: true,
        }, notificationId => {
            if (dtd.settle === dtd.total) {
                dtd.timerId && clearTimeout(dtd.timerId);
                dtd.reformat();
                chrome.notifications.clear(notificationId, wasCleared => {
                    if (wasCleared && tid === FP_TYPE_UPLOAD) {
                        chrome.notifications.create(dtd.notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notify_icon"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: "文件上传流程结束啦！",
                        });
                    }
                });
            }
        });

        dtd.timerId = nextFrame(loop);
    }

    dtd.timerId && clearTimeout(dtd.timerId);
    dtd.timerId = nextFrame(loop);
    return true;
}

/**
 * @package
 * @desc Progress 的内部实现是用单例模式（上传、下载各一种）
 * @desc 这个只能在 Background 中运行
 */
export class FileProgress {

    constructor(tid) {
        this.tid = tid;
        this.dtd = storeMap.get(this.tid);
    }

    /**
     * @public
     */
    consume(n = 1) {
        return this.dtd.consume(n);
    }

    /**
     * @public
     */
    padding(n = 1) {
        return this.dtd.padding(n);
    }

    /**
     * @public
     * @return {boolean}
     */
    trigger() {
        return coreInternalHander(this.tid);
    }

}
