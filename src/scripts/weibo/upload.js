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
 * @param {Blob|File} blob
 * @param {"arrayBuffer"|"dataURL"} channelType
 * @return {Promise<*>}
 * @reject {Promise<void>}
 */
async function readAsChannelType(blob, channelType) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const oneline = channel[channelType];
        reader.onloadend = e => {
            if (reader.readyState === reader.DONE) {
                resolve(reader.result);
            } else {
                reject();
            }
        };
        reader[oneline.readType](blob);
    });
}

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
 *
 * @param {Blob|File} blob
 * @param {"arrayBuffer"|"dataURL"} [channelType="arrayBuffer"]
 * @param {boolean} [_replay=false]
 * @return {Promise<PackedItem>}
 * @reject {Error}
 */
async function reader(blob, channelType = "arrayBuffer", _replay = false) {
    const data = {};
    const oneline = channel[channelType];
    const result = await readAsChannelType(blob, channelType);
    const mime = oneline.mimeType(result, blob);
    const chromeSupportedTypes = new Set(PConfig.chromeSupportedTypes);
    if (chromeSupportedTypes.has(mime) && !PConfig.weiboSupportedTypes[mime] && !_replay) {
        const b = await Utils.remuxImage(blob);
        return await reader(b, channelType, true);
    } else {
        data.result = result;
    }
    data.blob = blob;
    data.channelType = channelType;
    data.mimeType = oneline.mimeType(data.result);
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
    const oneline = channel[item.channelType];
    const method = "POST";
    const body = oneline.body(item.result);
    const param = oneline.param({ mime: item.mimeType }, watermark);
    const url = "http://picupload.weibo.com/interface/pic_upload.php";

    return Utils.fetch(Utils.buildURL(url, param), { method, body })
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
                            message: "用户信息解析成功",
                        });
                        attachPhotoToSpecialAlbum(pid, uid);
                    } catch (e) {
                        Log.w({
                            module: "uploader",
                            message: "用户信息解析失败",
                        });
                        attachPhotoToSpecialAlbum(pid);
                    }
                    Log.d({
                        module: "uploader",
                        message: "上传图片成功",
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
                        message: "上传图片失败，数据异常",
                        remark: text,
                    });
                    throw new Error(E_INVALID_PARSED_DATA);
                }
            } else {
                Log.e({
                    module: "uploader",
                    message: "上传图片失败，数据异常",
                    remark: text,
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
                            message: "请求用户登录状态时，捕获到异常",
                            remark: reason,
                        });
                        return Promise.reject({
                            login: reason.login,
                            terminable: !reason.login,
                        });
                    })
                    .then(json => {
                        if (json.login) {
                            Log.d({
                                module: "uploader",
                                message: "用户登录状态已被激活，重新尝试上传图片",
                            });
                            return uploader(item, watermark, true);
                        } else {
                            Log.w({
                                module: "uploader",
                                message: "用户处于登出状态，中止重试操作",
                                remark: json,
                            });
                            return Promise.reject({
                                login: reason.login,
                                terminable: !reason.login,
                            });
                        }
                    });
            } else {
                Log.w({
                    module: "uploader",
                    message: reason,
                    remark: "已经重试过了，这里直接抛出错误",
                });
                return Promise.reject(reason);
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
