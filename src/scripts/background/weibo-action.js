/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { FileProgress } from "./file-progress.js";
import { FP_TYPE_UPLOAD } from "../sharre/constant.js";

import { requestUpload } from "../weibo/upload.js";
import { detachPhotoFromSpecialAlbum, requestPhotosFromSpecialAlbum } from "../weibo/photo.js";
import { Log } from "../sharre/log.js";
import { signInByUserAccount } from "../weibo/author.js";

/**
 * @static
 * @public
 */
export class WeiboStatic {
    /**
     * @param {string[]} photoIds
     * @param {string} [albumId]
     * @return {Promise<*>}
     * @reject {Error}
     */
    static detachPhoto(photoIds, albumId) {
        return detachPhotoFromSpecialAlbum(photoIds, albumId);
    }

    /**
     * @param {number} page
     * @param {number} count
     * @param {string} [albumId]
     * @return {Promise<AlbumContents>}
     * @reject {Error}
     */
    static requestPhotos(page, count, albumId) {
        return requestPhotosFromSpecialAlbum(page, count, albumId);
    }

    /**
     * @param {string} username
     * @param {string} password
     * @return {Promise<void>}
     * @reject {Error}
     */
    static signInByUserAccount(username, password) {
        return signInByUserAccount(username, password);
    }
}

export class WeiboUpload {
    constructor() {
        this.queues = [];
        this.tailer = {
            done: true,
            iterator: this.genUploadQueues(),
            progress: new FileProgress(FP_TYPE_UPLOAD),
        };
    }

    /**
     * @public
     * @param {(Blob|File)[]} blobs
     */
    addQueues(blobs) {
        this.queues.push(...blobs);
        this.tailer.progress.padding(blobs.length);
    }

    /**
     * @public
     * @desc 如果当前迭代没有结束，此时再次调用没有任何效果
     * @param {Function} [cb] - 因为此函数只有在第一次运行时传入一次，所以这个函数**不属于**回调函数。
     *                          因此它不应该依赖闭包中的变量或函数，应该依赖 Context 中的变量或方法。
     *                          虽然大部分情况下程序能够正常运行，但是这种行为依然属于设计上的失误/错误。
     */
    triggerIteration(cb) {
        if (this.tailer.done && this.queues.length) {
            this.startPrivateIteration(cb);
            this.tailer.done = !this.queues.length;
            this.tailer.progress.trigger();
        }
    }

    /**
     * @private
     * @param {Function} [cb]
     */
    startPrivateIteration(cb) {
        this.tailer.iterator
            .next()
            .then(it => {
                if (it.done) {
                    if (this.queues.length) {
                        Log.w({
                            module: "WeiboUpload",
                            message: "迭代队列异常，中止后续操作",
                            remark: `剩余的迭代队列数量为：${this.queues.length}`,
                        });
                        /**
                         * @desc 迭代器提前终止的情况
                         * @desc 处理 FileProgress，然后清空 this.queues 队列
                         */
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
                    this.startPrivateIteration(cb);
                }
            })
            .catch(reason => {
                /**
                 * @desc 遇到 Promise.reject 时，迭代器会提前终止迭代
                 * @desc 但是最终 done 的值需要为 true，因此继续下一次迭代
                 */
                this.tailer.progress.consume();
                this.startPrivateIteration(cb);
            });
    }

    /**
     * @async
     * @private
     * @desc 迭代器迭代过程中遇到 Promise.reject，会造成迭代器提前结束
     *        为避免非致命性错误造成迭代器提前结束，异步生成器中需要处理这类错误
     * @return {Promise<PackedItem|null>}
     * @reject {{login: boolean, terminable: boolean}}
     */
    async *genUploadQueues() {
        while (this.queues.length) {
            yield await requestUpload(this.queues.shift()).catch(reason => {
                console.warn(reason);
                /**
                 * @desc 向后抛出致命性错误：
                 *          - 用户信息为已登录，可是上传仍然失败了
                 *          - 请求登录结束后，用户依然处于登出状态
                 * @desc 处理非致命性错误：
                 *          - 文件读取产生错误
                 *          - 文件格式不受支持
                 *          - 文件大小超出预期
                 *          - 非预期的程序错误
                 *          - 非致命性错误的上传失败
                 */
                if (reason && reason.terminable) {
                    return Promise.reject(reason);
                } else {
                    return Promise.resolve(null);
                }
            });
        }
    }
}
