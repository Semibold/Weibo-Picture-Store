/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { FileProgress } from "./file-progress.js";
import {
    E_FILE_SIZE_OVERFLOW,
    E_FILE_SIZE_RESTRICT,
    E_FILE_TYPE_RESTRICT,
    ET_UPLOAD_MUTATION,
    FP_TYPE_UPLOAD,
    K_WEIBO_INHERITED_WATERMARK,
    NID_UPLOAD_RESULT,
} from "../sharre/constant.js";

import { requestUpload } from "../weibo/upload.js";
import { detachPhotoFromSpecialAlbum, requestPhotosFromSpecialAlbum } from "../weibo/photo.js";
import { Log } from "../sharre/log.js";
import { signInByUserAccount } from "../weibo/author.js";
import { requestWeiboWatermark } from "../weibo/watermark.js";
import { ShareStore } from "./persist-store.js";

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

export class WeiboUpload extends EventTarget {
    constructor(notifyStats = false) {
        super();
        this.queues = [];
        this.tailer = {
            done: true,
            iterator: this.genUploadQueues(),
            progress: new FileProgress(FP_TYPE_UPLOAD),
        };
        this.notifyStats = notifyStats;
        this.queuesChangedTimer = null;
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
     * @param {Function} [cb] - 因为此参数只在第一次运行时传入有效，所以这个函数**不属于**回调函数。
     *                          因此它不应该依赖闭包中的变量或函数，应该依赖 Context 中的变量或方法。
     * @return {boolean}
     */
    triggerIteration(cb) {
        if (this.tailer.done && this.queues.length) {
            this.tailer.done = !this.queues.length;
            this.startPrivateIteration(cb);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @private
     */
    triggerUploadMutation() {
        const debounceHandler = () => {
            // 迭代器未结束时，上传正在进行，因此要+1
            const size = this.tailer.done ? 0 : this.queues.length + 1;
            this.dispatchEvent(
                new CustomEvent(ET_UPLOAD_MUTATION, {
                    detail: { size: size },
                }),
            );
            clearTimeout(this.queuesChangedTimer);
            this.queuesChangedTimer = null;
        };
        if (this.tailer.done) {
            return debounceHandler();
        }
        if (this.queuesChangedTimer == null) {
            this.queuesChangedTimer = setTimeout(debounceHandler, 300);
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
                    typeof cb === "function" && cb(it);
                    this.tailer.done = it.done;
                    this.tailer.iterator = this.genUploadQueues();
                    if (this.notifyStats) {
                        const { succeed, failure, discard } = this.tailer.progress.previousStatus;
                        if (failure || discard) {
                            chrome.notifications.create(NID_UPLOAD_RESULT, {
                                type: "basic",
                                iconUrl: chrome.i18n.getMessage("notify_icon"),
                                title: chrome.i18n.getMessage("warn_title"),
                                message: `成功：${succeed}，失败：${failure}，丢弃：${discard}`,
                                contextMessage: "丢弃：超过20MB的文件或浏览器不支持的文件类型",
                            });
                        }
                    }
                    this.triggerUploadMutation();
                } else {
                    typeof cb === "function" && cb(it);
                    this.tailer.done = it.done;
                    this.startPrivateIteration(cb);
                }
            })
            .catch(reason => {
                /**
                 * @desc 遇到 Promise.reject 时，迭代器会提前终止迭代
                 * @desc 但是最终 done 的值需要为 true，因此继续下一次迭代
                 */
                this.startPrivateIteration(cb);
            });
    }

    /**
     * @async
     * @private
     * @desc 迭代器迭代过程中遇到 Promise.reject，会造成迭代器提前结束
     *        为避免非致命性错误造成迭代器提前结束，异步生成器中需要处理这类错误
     * @return {Promise<PackedItem|null>}
     * @reject {Error|{login: boolean, terminable: boolean}}
     */
    async *genUploadQueues() {
        const watermark = await requestWeiboWatermark(ShareStore.get(K_WEIBO_INHERITED_WATERMARK));
        while (this.queues.length) {
            this.triggerUploadMutation();
            yield await requestUpload(this.queues.shift(), watermark)
                .then(item => {
                    this.tailer.progress.succeed();
                    return Promise.resolve(item);
                })
                .catch(reason => {
                    console.warn(reason);

                    switch (reason && reason.message) {
                        case E_FILE_TYPE_RESTRICT:
                        case E_FILE_SIZE_RESTRICT:
                        case E_FILE_SIZE_OVERFLOW:
                            this.tailer.progress.discard();
                            break;
                        default:
                            this.tailer.progress.failure();
                            break;
                    }

                    /**
                     * @desc 向后抛出致命性错误：
                     *          - 用户信息为已登录，可是上传仍然失败了
                     *          - 请求登录结束后，用户依然处于登出状态
                     *          - 用户请求登录时捕获到错误
                     * @desc 处理非致命性错误：
                     *          - 文件读取产生错误
                     *          - 文件格式不受支持
                     *          - 文件大小超出预期
                     *          - 非预期的程序错误
                     *          - 非致命性错误的上传失败
                     */
                    if (reason && reason.terminable) {
                        /**
                         * @desc 迭代器提前终止的情况
                         * @desc 处理 FileProgress，然后清空 this.queues 队列
                         */
                        if (this.queues.length) {
                            Log.w({
                                module: "WeiboUpload",
                                error: reason,
                                remark: `迭代队列异常，中止后续操作。剩余的迭代队列数量为：${this.queues.length}`,
                            });
                            this.tailer.progress.discard(this.queues.length);
                            this.queues.length = 0;
                        }
                        return Promise.reject(reason);
                    } else {
                        return Promise.resolve(null);
                    }
                });
        }
    }
}
