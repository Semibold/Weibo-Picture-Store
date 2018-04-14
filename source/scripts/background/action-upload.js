/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {QCloudStorageAuth} from "../auth/qcloud-storage.js";
import {FileProgress} from "./file-progress.js";
import {syncedSData} from "./synced-sdata.js";

import {weiboRandomHost} from "../weibo/channel.js";
import {filePurity} from "./file-purity.js";
import {readFile} from "../weibo/read-file.js";
import {fileUpload} from "../weibo/file-upload.js";
import {genFilename} from "../plugin/gen-filename.js";

import {gtracker} from "../plugin/g-tracker.js";

export class ActionUpload {

    constructor() {
        this.queues = [];
        this.tailer = {};
    }

    /**
     * @public
     * @return {ActionUpload}
     */
    init() {
        this.tailer.done = true;
        this.tailer.iterator = this.genUploadQueues();
        this.tailer.progress = new FileProgress(FileProgress.ACTION_UPLOAD);
        return this;
    }

    /**
     * @public
     * @param {Object[]} list
     * @return {boolean}
     */
    addQueues(list) {
        const cd = syncedSData.cdata; // Serve async as sync
        if (cd) {
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                const z = item.type.split("/")[1];
                this.queues.push(Object.assign({
                    data: cd,
                    host: cd.ssp === "weibo_com" ? weiboRandomHost() : cd.host,
                    blob: item,
                    mime: {
                        type: item.type,
                        suffix: z ? `.${z}` : "",
                    },
                }));
            }
            this.tailer.progress.padding(list.length);
        } else {
            gtracker.exception({
                exDescription: "ActionUpload: Cannot get selected data",
                exFatal: true,
            });
        }
        return Boolean(cd);
    }

    /**
     * @public
     * @desc 如果当前迭代没有结束，此时再次调用没有任何效果
     * @param {Function} [cb]
     */
    startAutoIteration(cb) {
        if (this.tailer.done && this.queues.length) {
            this.runIteration(cb);
            this.tailer.progress.trigger();
        }
    }

    /**
     * @private
     * @param {Function} [cb]
     */
    runIteration(cb) {
        this.tailer.iterator.next().then(it => {
            if (it.done) {
                if (this.queues.length) {
                    // 迭代器提前终止的情况
                    this.tailer.progress.consume(this.queues.length);
                    this.queues.length = 0;
                }
                typeof cb === "function" && cb(it);
                this.tailer.done = it.done;
                this.tailer.iterator = this.genUploadQueues();
            } else {
                typeof cb === "function" && cb(it);
                this.tailer.progress.consume();
                this.tailer.done = it.done;
                this.runIteration(cb);
            }
        }).catch(reason => {
            // 迭代器提前终止，但是最终 done 的值需要为 true，因此继续下一次迭代
            console.warn(reason);
            this.tailer.progress.consume();
            this.runIteration(cb);
        });
    }

    /**
     * @async
     * @private
     * @desc 迭代器迭代过程中遇到 Promise.reject，会造成迭代器提前结束
     *        为避免非致命性错误造成迭代器提前结束，异步生成器中需要处理这类错误
     */
    async *genUploadQueues() {
        while (this.queues.length) {
            const item = this.queues.shift();
            yield await this.constructor[item.data.ssp](item);
        }
    }

    /** @private */
    static async weibo_com(d0) {
        const d1 = await readFile(d0);
        const d2 = await filePurity(d1);
        if (!d2) return;
        return await fileUpload(d2);
    }

    /** @private */
    static async qcloud_com(d0) {
        const d1 = await filePurity(d0);
        if (!d1) return;
        const {akey, skey, host, path} = d1.data;
        const qsa = new QCloudStorageAuth(akey, skey);
        const filename = await genFilename(d1.blob, true);
        const filepath = `/${path + filename}`;
        const headers = await qsa.getAuthHeaders("PUT", filepath, host);
        headers.set("Content-Type", d1.blob.type);
        headers.set("Content-Length", d1.blob.size);
        const res = await fetch(qsa.auths.url.toString(), {headers, method: qsa.auths.method, body: d1.blob});
        if (res.status === 200 && d1.blob.type.startsWith("image/")) {
            return Object.assign(d1, {fid: filepath});
        }
    }


    /** @private */
    static async qiniu_com() {}

    /** @private */
    static async aliyun_com() {}

    /** @private */
    static async upyun_com() {}

}
