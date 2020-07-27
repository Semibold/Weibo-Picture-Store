/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { LogStore } from "../background/persist-store.js";

const MAXIMUM_LOGS = 2000;
const backWindow = chrome.extension.getBackgroundPage();

/**
 * @static
 * @desc Can NOT be used in content scripts.
 */
export class Log {
    /**
     * @private
     */
    static get store() {
        if (backWindow === self) {
            return LogStore;
        } else {
            return backWindow.coreAPIs.LogStore;
        }
    }

    /**
     * @public
     */
    static get LEVEL() {
        return { debug: "debug", warn: "warn", error: "error" };
    }

    /**
     * @typedef {Object} ErrObject
     * @property {string} module                                        - 所属模块
     * @property {string|Error|DOMError|DOMException|Object} [error]    - 抛出的信息
     * @property {string|Object} [remark]                               - 可读的信息
     */

    /**
     * @private
     * @param {ErrObject} obj                      - 注意：此对象的内容会被更改
     * @param {string} [type]                      - keyof Log.LEVEL
     * @return {boolean}
     */
    static add(obj, type = Log.LEVEL.debug) {
        const types = Object.keys(Log.LEVEL);
        const info = { error: "", remark: "" };

        if (!types.includes(type)) {
            console.warn("Invalid `type` parameter");
            return false;
        }

        while (Log.store.size >= MAXIMUM_LOGS) {
            const value = Array.from(Log.store).shift();
            Log.store.delete(value);
        }

        if (typeof obj.remark === "string") {
            info.remark = obj.remark;
        } else if (obj.remark) {
            try {
                info.remark = JSON.stringify(obj.remark);
            } catch (e) {
                console.warn(e);
            }
        }

        if (obj.error) {
            if (typeof obj.error === "string") {
                info.error = obj.error;
            } else {
                if (obj.error && typeof obj.error.message === "string") {
                    info.error = obj.error.message;
                } else {
                    try {
                        info.error = JSON.stringify(obj.error);
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }
        }

        const fd = Object.assign(obj, info, { type, timestamp: Date.now() });

        Log.store.add(fd);

        if (DEBUG && typeof console[type] === "function") {
            console[type](`[${fd.module}]`, fd.remark || fd.error);
        }

        return true;
    }

    /**
     * @public
     * @param {ErrObject} obj
     */
    static d(obj) {
        Log.add(obj, Log.LEVEL.debug);
    }

    /**
     * @public
     * @param {ErrObject} obj
     */
    static w(obj) {
        Log.add(obj, Log.LEVEL.warn);
    }

    /**
     * @public
     * @param {ErrObject} obj
     */
    static e(obj) {
        Log.add(obj, Log.LEVEL.error);
    }

    /**
     * @public
     * @param {string[]} [types]
     * @return {string}
     */
    static serialize(types = Object.keys(Log.LEVEL)) {
        const caches = [];
        const padNum = Math.max(...types.map(x => x.length));
        caches.push("------------------ Metadata Starting ------------------");
        caches.push(`Version: ${chrome.runtime.getManifest().version}`);
        caches.push(`User-Agent: ${self.navigator.userAgent}`);
        caches.push("------------------ Metadata Finished ------------------");
        Log.store.forEach((k, v) => {
            if (types.includes(v.type)) {
                // prettier-ignore
                caches.push(`[${v.type.toUpperCase().padEnd(padNum, ".")}]-[${new Date(v.timestamp).toISOString()}]-[${v.module}]-[${v.error}]-[${v.remark}]`);
            }
        });
        return caches.join("\r\n");
    }

    /**
     * @public
     */
    static download() {
        const blobUrl = URL.createObjectURL(new Blob([Log.serialize()], { type: "text/plain" }));
        const destroy = downloadDelta => {
            if (downloadDelta.endTime || downloadDelta.error) {
                URL.revokeObjectURL(blobUrl);
                if (chrome.downloads.onChanged.hasListener(destroy)) {
                    chrome.downloads.onChanged.removeListener(destroy);
                }
            }
        };
        chrome.downloads.onChanged.addListener(destroy);
        chrome.downloads.download({
            url: blobUrl,
            filename: "Weibo-Picture-Store_logs.txt",
        });
    }
}
