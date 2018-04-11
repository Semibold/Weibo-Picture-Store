/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {FileProgress} from "./file-progress.js";
import {FP_ACTION_UPLOAD} from "./file-progress.js";

export const AP_ACTION_UPLOAD = 1;

export class ActionProxy {

    constructor(action) {
        this.action = action;
        this.queues = [];
        this.tailer = {};
    }

    /**
     * @public
     * @return {ActionProxy}
     */
    init() {
        if (this.action === AP_ACTION_UPLOAD) {
            this.tailer.done = true;
            this.tailer.iterator = this.genUploadQueues();
            this.tailer.progress = new FileProgress(FP_ACTION_UPLOAD);
        }
        return this;
    }

    /**
     * @public
     * @desc 如果当前迭代没有结束，此时再次调用没有任何效果
     * @param {Function} [cb]
     */
    startAutoIteration(cb) {
        if (this.action === AP_ACTION_UPLOAD) {
            if (this.tailer.done && this.queues.length) {
                this.runIteration(cb);
                this.tailer.progress.trigger();
            }
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
                    this.tailer.progress.consume(this.queues.length + 1);
                    this.queues.length = 0;
                }
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
            this.runIteration(cb);
        });
    }

    /**
     * @public
     * @param {Object[]} list
     */
    addQueues(list) {
        if (this.action === AP_ACTION_UPLOAD) {
            this.queues.push(...list);
            this.tailer.progress.padding(list.length);
        }
    }

    /**
     * @async
     * @private
     * @desc 迭代器迭代过程中遇到 Promise.reject，会造成迭代器提前结束
     *        为避免非致命性错误造成迭代器提前结束，异步生成器中需要处理这类错误
     */
    async *genUploadQueues() {
        while (this.queues.length) {
            // @todo 这里处理上传.catch
            yield this.queues.shift();
        }
    }

}
