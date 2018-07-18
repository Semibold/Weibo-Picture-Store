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
        data.result = await reader(b, channelType, true);
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
                const data = tree.querySelector("data").textContent;
                const pid = tree.querySelector("pic_1 > pid").textContent;
                const size = tree.querySelector("pic_1 > size").textContent;
                const width = tree.querySelector("pic_1 > width").textContent;
                const height = tree.querySelector("pic_1 > height").textContent;

                if (pid) {
                    try {
                        const uid = JSON.parse(atob(data)).uid.toString();
                        attachPhotoToSpecialAlbum(pid, uid);
                    } catch (e) {
                        attachPhotoToSpecialAlbum(pid);
                    }
                    return Object.assign(item, {pid});
                } else {
                    return Promise.reject(new Error("Invalid Data"));
                }
            } else {
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
                        return Promise.reject({
                            login: reason.login,
                            terminable: true,
                        });
                    })
                    .then(json => {
                        if (json.login) {
                            return uploader(item, true);
                        } else {
                            return Promise.reject({
                                login: reason.login,
                                terminable: true,
                            });
                        }
                    });
            } else {
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
