/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * WARNING: `requestAnimationFrame` has no effect on chrome background page
 */
import { Utils } from "../sharre/utils.js";
import { FP_TYPE_DOWNLOAD, FP_TYPE_UPLOAD } from "../sharre/constant.js";

const fileProgressMap = new Map();

/**
 * @desc 用于支持多类型
 */
class TypeEntry {
    /**
     * @param {number} tid
     * @return {boolean}
     */
    static notify(tid) {
        let message;
        let contextMessage;
        let dtd = fileProgressMap.get(tid);

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

        chrome.notifications.create(
            dtd.notifyId,
            {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: message,
                contextMessage: contextMessage,
            },
            notificationId => {
                if (dtd.settle === dtd.total) {
                    dtd.reformat();
                    tid === FP_TYPE_UPLOAD &&
                        chrome.notifications.create(notificationId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notify_icon"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: "文件上传流程结束啦！",
                        });
                }
            },
        );

        return true;
    }

    constructor(tid) {
        this.notifyId = Utils.randomString(16);
        this.total = 0;
        this.settle = 0;
        fileProgressMap.set(tid, this);
    }

    reformat() {
        this.total = 0;
        this.settle = 0;
    }

    consume(n) {
        if (Number.isInteger(n) && n > 0) {
            if (this.settle + n <= this.total) {
                this.settle += n;
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
 * @export
 * @desc Progress 的内部实现是用单例模式（上传、下载各一种）
 * @desc 这个只能在 Background 中运行
 */
export class FileProgress {
    constructor(tid) {
        this.tid = tid;
        this.dtd = fileProgressMap.get(this.tid);
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
        return TypeEntry.notify(this.tid);
    }
}
