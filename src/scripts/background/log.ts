/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Base64 } from "../sharre/base64.js";

const MAXIMUM_LOGS = 2000;
const LOG_STORE: Set<WB.LogStoreItem> = new Set();

/**
 * @static
 * @desc Can NOT be used in content scripts.
 */
export class Log {
    /**
     * @private
     */
    static get store() {
        return LOG_STORE;
    }

    /**
     * @public
     */
    static get LEVEL() {
        return { debug: "debug", warn: "warn", error: "error" };
    }

    /**
     * @private
     */
    static add(obj: WB.LogErrDetail, type = Log.LEVEL.debug) {
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

        if (self.__isDev) {
            // @ts-ignore
            typeof console[type] === "function" && console[type](`[${fd.module}]`, fd.remark || fd.error);
        }

        return true;
    }

    /**
     * @public
     */
    static d(obj: WB.LogErrDetail) {
        Log.add(obj, Log.LEVEL.debug);
    }

    /**
     * @public
     */
    static w(obj: WB.LogErrDetail) {
        Log.add(obj, Log.LEVEL.warn);
    }

    /**
     * @public
     */
    static e(obj: WB.LogErrDetail) {
        Log.add(obj, Log.LEVEL.error);
    }

    /**
     * @public
     */
    static serialize(types = Object.keys(Log.LEVEL)) {
        const caches = [];
        const padNum = Math.max(...types.map((x) => x.length));
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
     * @private
     * @desc suitable for background.html
     */
    static downloadWithObjectUrl() {
        const blobUrl = URL.createObjectURL(new Blob([Log.serialize()], { type: "text/plain" }));
        const destroy = (downloadDelta: chrome.downloads.DownloadDelta) => {
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

    /**
     * @private
     * @desc suitable for chrome service worker (NOT work in firefox)
     */
    static downloadWithDataUrl() {
        const b64 = Base64.encode(Log.serialize());
        const b64Url = `data:text/plain;base64,${b64}`;
        chrome.downloads.download({
            url: b64Url,
            filename: "Weibo-Picture-Store_logs.txt",
        });
    }

    /**
     * @public
     */
    static download() {
        if (self.URL && typeof self.URL.createObjectURL === "function") {
            Log.downloadWithObjectUrl();
        } else {
            Log.downloadWithDataUrl();
        }
    }
}
