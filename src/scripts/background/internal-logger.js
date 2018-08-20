/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

const MAXIMUM_LOGS = 10000;

class InternalLogger extends Set {

    // noinspection JSMethodCanBeStatic
    /**
     * @return {{log: string, warn: string, error: string}}
     */
    get LEVEL() {
        return {log: "log", warn: "warn", error: "error"};
    }

    /**
     * @param {Object} obj                  - 注意：此对象的内容会被更改
     * @param {string} obj.module           - 所属模块
     * @param {string|Error} obj.message    - 抛出的信息
     * @param {string} [obj.remark]         - 备注信息
     * @param {string} [type]               - keyof this.LEVEL
     * @return {boolean}
     */
    add(obj, type = this.LEVEL.log) {
        const types = Object.keys(this.LEVEL);
        const info = {message: "N/A", remark: "N/A"};
        if (!types.includes(type)) {
            console.warn("Invalid `type` parameter");
            return false;
        }
        while (this.size >= MAXIMUM_LOGS) {
            const [key, value] = Object.entries(this).shift();
            this.delete(value);
        }
        if (typeof obj.remark === "string") {
            info.remark = obj.remark;
        }
        if (typeof obj.message === "string") {
            info.message = obj.message;
        } else {
            const error = obj.message;
            if (error && typeof error.message === "string") {
                info.message = error.message;
            }
        }
        super.add(Object.assign(obj, info, {
            type,
            timestamp: Date.now(),
        }));
        return true;
    }

    /**
     * @param {string[]} [types]
     * @return {string}
     */
    serialize(types = Object.keys(this.LEVEL)) {
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
            URL.revokeObjectURL(blobUrl);
        });
    }

}

/**
 * @desc 不要使用此模块记录敏感信息
 */
export const logger = new InternalLogger();
