/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

const MAXIMUM_LOGS = 20000;

class InternalLogger extends Set {

    /**
     * @param {Object} obj              - 注意：此对象的内容会被更改
     * @param {string} obj.module       - 所属模块
     * @param {string} obj.message      - 抛出的错误信息
     * @param {string} [obj.remark]     - 备注信息
     * @param {string} [type]           - "log" | "warn" | "error"
     */
    add(obj, type = "log") {
        const types = ["log", "warn", "error"];
        if (!types.includes(type)) {
            throw new Error("Invalid `type` parameter");
        }
        if (this.size > MAXIMUM_LOGS) {
            const [key, value] = Object.entries(this).shift();
            this.delete(value);
        }
        super.add(Object.assign(obj, {
            type,
            remark: obj.remark || "N/A",
            timestamp: Date.now(),
        }));
    }

    /**
     * @param {string[]} [types]
     * @return {string}
     */
    serialize(types = ["log", "warn", "error"]) {
        const caches = [];
        const padNum = Math.max(...types.map(x => x.length));
        this.forEach((k, v) => {
            if (types.includes(v.type)) {
                caches.push(`[${v.type.toUpperCase().padEnd(padNum, ".")}]-[${new Date(v.timestamp).toISOString()}]-[${v.module}]-[${v.message}]-[${v.remark}]`);
            }
        });
        return caches.join("\r\n");
    }

    download() {
        const blobUrl = URL.createObjectURL(new Blob([this.serialize()], {type: "text/plain"}));
        chrome.downloads.download({
            url: blobUrl,
            filename: "Weibo-Picture-Store_logs.txt",
        }, downloadId => {
            Url.revokeObjectURL(blobUrl);
        });
    }

}

/**
 * @desc 不要使用此模块记录敏感信息
 */
export const logger = new InternalLogger();
