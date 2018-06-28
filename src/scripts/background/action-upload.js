/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {FileProgress} from "./file-progress.js";
import {FP_TYPE_UPLOAD} from "../sharre/constant.js";

import {filePurity} from "../weibo/file-purity.js";
import {readFile} from "../weibo/read-file.js";
import {fileUpload} from "../weibo/file-upload.js";

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
        this.tailer.progress = new FileProgress(FP_TYPE_UPLOAD);
        return this;
    }

    /**
     * @public
     * @param {Object[]} list
     */
    addQueues(list) {
        this.queues.push(...list);
        this.tailer.progress.padding(list.length);
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
            const blob = this.queues.shift();
            yield await this.constructor.triggerFileUpload(blob);
        }
    }

    /** @private */
    static async triggerFileUpload(blob) {
        const data = await readFile(blob);
        const item = await filePurity(data);
        if (!item) return;
        return await fileUpload(item);
    }

}
