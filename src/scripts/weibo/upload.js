/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {channel} from "./channel.js";
import {remuxImage} from "../sharre/remux-image.js";
import {Utils} from "../sharre/utils.js";
import {PConfig} from "../sharre/constant.js";
import {attachPhotoToSpecialAlbum} from "./photo.js";
import {requestSignIn} from "./author.js";
import {logger} from "../background/internal-logger.js";

/**
 * @param {Blob|File} blob
 * @param {"arrayBuffer"|"dataURL"} channelType
 * @return {Promise<*, void>}
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
 *
 * @param {Blob|File} blob
 * @param {"arrayBuffer"|"dataURL"} [channelType="arrayBuffer"]
 * @param {boolean} [_replay=false]
 * @return {Promise<PackedItem, Error>}
 */
async function reader(blob, channelType = "arrayBuffer", _replay = false) {
    const data = {};
    const oneline = channel[channelType];
    const result = await readAsChannelType(blob, channelType);
    const mime = oneline.mimeType(result);
    const chromeSupportedTypes = new Set(PConfig.chromeSupportedTypes);
    if (chromeSupportedTypes.has(mime) && !PConfig.weiboSupportedTypes[mime] && !_replay) {
        const b = await remuxImage(blob);
        return await reader(b, channelType, true);
    } else {
        data.result = result;
    }
    data.blob = blob;
    data.channelType = channelType;
    data.mimeType = oneline.mimeType(data.result);
    return data;
}

const sizeSlopId = Utils.randomString(16);
const typeSlopId = Utils.randomString(16);

/**
 * @param {PackedItem} item
 * @return {Promise<PackedItem, Error>}
 */
async function purity(item) {
    if (!PConfig.weiboSupportedTypes[item.mimeType]) {
        chrome.notifications.create(typeSlopId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: "暂不支持当前选中的文件格式",
        });
        return Promise.reject(new Error("Unsupported file format"));
    }
    if (item.blob.size > 20 * 1024 * 1024 - 1) {
        chrome.notifications.create(sizeSlopId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: `检测到某些文件的大小超过20MB，自动丢弃这些文件`,
        });
        return Promise.reject(new Error("Filesize overflow"));
    }
    return item;
}

const loginFailedId = Utils.randomString(16);

/**
 * @param {PackedItem} item
 * @param {boolean} [_replay=false]
 * @return {Promise<PackedItem, Error|{login: boolean, terminable: boolean}>}
 */
async function uploader(item, _replay = false) {
    const oneline = channel[item.channelType];
    const method = "POST";
    const body = oneline.body(item.result);
    const param = oneline.param({mime: item.mimeType});
    const url = "http://picupload.weibo.com/interface/pic_upload.php";

    return Utils
        .fetch(Utils.buildURL(url, param), {method, body})
        .then(response => response.ok ? response.text() : Promise.reject(new Error(response.statusText)))
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
                        logger.add({
                            module: "uploader",
                            message: "用户信息解析成功",
                        });
                        attachPhotoToSpecialAlbum(pid, uid);
                    } catch (e) {
                        logger.add({
                            module: "uploader",
                            message: "用户信息解析失败",
                        }, logger.LEVEL.warn);
                        attachPhotoToSpecialAlbum(pid);
                    }
                    logger.add({
                        module: "uploader",
                        message: "上传图片成功",
                    });
                    return Object.assign(item, {pid});
                } else {
                    logger.add({
                        module: "uploader",
                        message: "上传图片失败，数据异常",
                        remark: text,
                    }, logger.LEVEL.error);
                    return Promise.reject(new Error("Invalid Data"));
                }
            } else {
                logger.add({
                    module: "uploader",
                    message: "上传图片失败，数据异常",
                    remark: text,
                }, logger.LEVEL.error);
                return Promise.reject(new Error("Invalid Data"));
            }
        }).catch(reason => {
            if (!_replay) {
                return requestSignIn(true)
                    .catch(reason => {
                        reason.login && chrome.notifications.create(loginFailedId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notify_icon"),
                            title: chrome.i18n.getMessage("fail_title"),
                            message: "微博登录信息校验成功，可是。。。图片上传失败了呢",
                        });
                        logger.add({
                            module: "uploader",
                            message: "请求用户登录状态时，捕获到异常",
                            remark: JSON.stringify(reason),
                        }, logger.LEVEL.warn);
                        return Promise.reject({
                            login: reason.login,
                            terminable: !reason.login,
                        });
                    })
                    .then(json => {
                        if (json.login) {
                            logger.add({
                                module: "uploader",
                                message: "用户登录状态已被激活，重新尝试上传图片"
                            });
                            return uploader(item, true);
                        } else {
                            logger.add({
                                module: "uploader",
                                message: "用户处于登出状态，中止重试操作",
                                remark: JSON.stringify(json),
                            }, logger.LEVEL.warn);
                            return Promise.reject({
                                login: reason.login,
                                terminable: !reason.login,
                            });
                        }
                    });
            } else {
                logger.add({
                    module: "uploader",
                    message: reason,
                    remark: "已经重试过了，这里直接抛出错误",
                }, logger.LEVEL.warn);
                return Promise.reject(reason);
            }
        });
}

/**
 * @public
 * @param {Blob|File} blob
 * @return {Promise<PackedItem, Error|{login: boolean, terminable: boolean}>}
 */
export async function requestUpload(blob) {
    return await uploader(await purity(await reader(blob)));
}
