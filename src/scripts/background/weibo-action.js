/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {FileProgress} from "./file-progress.js";
import {FP_TYPE_UPLOAD} from "../sharre/constant.js";

import {requestUpload} from "../weibo/upload.js";
import {detachPhotoFromSpecialAlbum, requestPhotosFromSpecialAlbum} from "../weibo/photo.js";
import {logger} from "./internal-logger.js";

/**
 * @static
 * @public
 */
export class WeiboStatic {

    /**
     * @param {string[]} photoIds
     * @return {Promise<*, Error>}
     */
    static detachPhoto(photoIds) {
        return detachPhotoFromSpecialAlbum(photoIds);
    }

    /**
     * @param {number} page
     * @param {number} count
     * @return {Promise<{
     *   total: number,
     *   photos: {
     *     albumId: string,
     *     photoId: string,
     *     picHost: string,
     *     picName: string,
     *     updated: string
     *   }[]
     * }>, Error}
     */
    static requestPhotos(page, count) {
        return requestPhotosFromSpecialAlbum(page, count);
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
     * @param {Function} [cb]
     */
    triggerIteration(cb) {
        if (this.tailer.done && this.queues.length) {
            this.startPrivateIteration(cb);
            this.tailer.progress.trigger();
        }
    }

    /**
     * @private
     * @param {Function} [cb]
     */
    startPrivateIteration(cb) {
        this.tailer.iterator.next().then(it => {
            if (it.done) {
                if (this.queues.length) {
                    logger.add({
                        module: "WeiboUpload",
                        message: "迭代队列异常，中止后续操作",
                        remark: `剩余的迭代队列数量为：${this.queues.length}`,
                    }, logger.LEVEL.warn);
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
        }).catch(reason => {
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
     * @return {Promise<PackedItem|null, {login: boolean, terminable: boolean}>}
     */
    async *genUploadQueues() {
        while (this.queues.length) {
            yield await requestUpload(this.queues.shift())
                .catch(reason => {
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
