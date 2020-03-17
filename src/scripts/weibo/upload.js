/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { channel } from "./channel.js";
import { Utils } from "../sharre/utils.js";
import {
    PConfig,
    MAXIMUM_WEIBO_PICTURE_SIZE,
    E_INVALID_PARSED_DATA,
    E_FILE_TYPE_RESTRICT,
    E_FILE_SIZE_RESTRICT,
    E_FILE_SIZE_OVERFLOW,
    UNKNOWN_FILE_SIZE_RESTRICT,
    NID_SIGNIN_RESULT,
} from "../sharre/constant.js";
import { attachPhotoToSpecialAlbum } from "./photo.js";
import { requestSignIn } from "./author.js";
import { Log } from "../sharre/log.js";

/**
 * @typedef {Object} PackedItem
 * @property {Blob|File} blob
 * @property {ArrayBuffer|string} result
 * @property {string} channelType
 * @property {string} mimeType
 * @property {string} [pid]
 * @property {number} [size]
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * @param {Blob|File} blob
 * @param {"arrayBuffer"|"dataURL"} [channelType="arrayBuffer"]
 * @param {boolean} [_replay=false]
 * @return {Promise<PackedItem>}
 * @reject {Error}
 */
async function reader(blob, channelType = "arrayBuffer", _replay = false) {
    const data = {};
    const pipeline = channel[channelType];
    const result = await Utils.readAsChannelType(blob, channelType);
    const mime = pipeline.mimeType(result, blob);
    const chromeSupportedTypes = new Set(PConfig.chromeSupportedTypes);
    if (chromeSupportedTypes.has(mime) && !PConfig.weiboSupportedTypes[mime] && !_replay) {
        const b = await Utils.remuxImage(blob);
        return await reader(b, channelType, true);
    } else {
        data.result = result;
    }
    data.blob = blob;
    data.channelType = channelType;
    data.mimeType = pipeline.mimeType(data.result);
    return data;
}

/**
 * @param {PackedItem} item
 * @return {Promise<PackedItem>}
 * @reject {Error}
 */
async function purifier(item) {
    if (!PConfig.weiboSupportedTypes[item.mimeType]) {
        throw new Error(E_FILE_TYPE_RESTRICT);
    }
    if (item.blob.size > MAXIMUM_WEIBO_PICTURE_SIZE) {
        throw new Error(E_FILE_SIZE_OVERFLOW);
    }
    return item;
}

/**
 * @param {PackedItem} item
 * @param {Watermark|null} [watermark]
 * @param {boolean} [_replay=false]
 * @return {Promise<PackedItem>}
 * @reject {Error|{login: boolean, terminable: boolean}}
 */
async function uploader(item, watermark = null, _replay = false) {
    const pipeline = channel[item.channelType];
    const method = "POST";
    const body = pipeline.body(item.result);
    const param = pipeline.param({ mime: item.mimeType }, watermark);
    const url = "https://picupload.weibo.com/interface/pic_upload.php";

    return /** @type {Promise<PackedItem>} */ Utils.fetch(Utils.buildURL(url, param), { method, body })
        .then(response => response.text())
        .then(text => {
            if (text) {
                const tree = new DOMParser().parseFromString(text, "text/xml");
                const node = {
                    data: tree.querySelector("data"),
                    pid: tree.querySelector("pic_1 > pid"),
                    size: tree.querySelector("pic_1 > size"),
                    width: tree.querySelector("pic_1 > width"),
                    height: tree.querySelector("pic_1 > height"),
                };
                const data = node.data && node.data.textContent;
                const pid = node.pid && node.pid.textContent;
                const size = node.size && node.size.textContent;
                const width = node.width && node.width.textContent;
                const height = node.height && node.height.textContent;

                if (pid) {
                    try {
                        const uid = JSON.parse(atob(data)).uid.toString();
                        Log.d({
                            module: "uploader",
                            remark: "用户信息解析成功",
                        });
                        attachPhotoToSpecialAlbum(pid, uid);
                    } catch (e) {
                        Log.w({
                            module: "uploader",
                            error: e,
                            remark: "用户信息解析失败",
                        });
                        attachPhotoToSpecialAlbum(pid);
                    }
                    Log.d({
                        module: "uploader",
                        remark: "上传图片成功",
                    });
                    return Object.assign(item, {
                        pid,
                        size: Number(size),
                        width: Number(width),
                        height: Number(height),
                    });
                } else {
                    Log.e({
                        module: "uploader",
                        error: text,
                        remark: "上传图片失败，数据异常",
                    });
                    throw new Error(E_INVALID_PARSED_DATA);
                }
            } else {
                Log.e({
                    module: "uploader",
                    error: text,
                    remark: "上传图片失败，数据异常",
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch(reason => {
            if (!_replay) {
                return requestSignIn(true)
                    .catch(reason => {
                        reason.login &&
                            chrome.notifications.create(NID_SIGNIN_RESULT, {
                                type: "basic",
                                iconUrl: chrome.i18n.getMessage("notify_icon"),
                                title: chrome.i18n.getMessage("fail_title"),
                                message: "微博登录信息校验成功，可是。。。图片上传失败了呢",
                            });
                        Log.w({
                            module: "uploader",
                            error: reason,
                            remark: "请求用户登录状态时，捕获到异常",
                        });
                        return Promise.reject({
                            login: reason.login,
                            terminable: true,
                        });
                    })
                    .then(json => {
                        if (json.login) {
                            Log.d({
                                module: "uploader",
                                remark: "用户登录状态已被激活，重新尝试上传图片",
                            });
                            return uploader(item, watermark, true);
                        } else {
                            Log.w({
                                module: "uploader",
                                error: json,
                                remark: "用户处于登出状态，中止重试操作",
                            });
                            return Promise.reject({
                                login: reason.login,
                                terminable: true,
                            });
                        }
                    });
            } else {
                Log.w({
                    module: "uploader",
                    error: reason,
                });
                return Promise.reject({
                    login: true,
                    terminable: true,
                });
            }
        });
}

/**
 * @export
 * @param {Blob|File} blob
 * @param {Watermark|null} [watermark]
 * @return {Promise<PackedItem>}
 * @reject {Error|{login: boolean, terminable: boolean}}
 */
export async function requestUpload(blob, watermark) {
    if (blob.size > UNKNOWN_FILE_SIZE_RESTRICT) {
        throw new Error(E_FILE_SIZE_RESTRICT);
    } else {
        return await uploader(await purifier(await reader(blob)), watermark);
    }
}
