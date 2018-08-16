/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {USER_INFO_CACHE} from "../sharre/constant.js";
import {requestSpecialAlbumId} from "./album.js";
import {requestSignIn} from "./author.js";
import {logger} from "../background/internal-logger.js";

/**
 * @package
 * @param {string} pid
 * @param {string} [uid]
 * @param {boolean} [_replay=false]
 * @return {Promise<void, Error>}
 */
export async function attachPhotoToSpecialAlbum(pid, uid, _replay = false) {
    const overflow = 1000; // 相册的最大存储量
    const overflowCode = 11112; // 相册存储量溢出时的返回码
    const promise = requestSpecialAlbumId(uid);
    return promise
        .then(albumInfo => {
            return Utils.fetch("http://photo.weibo.com/upload/photo", {
                method: "POST",
                body: Utils.createSearchParams({
                    pid: pid,
                    isOrig: 1,
                    album_id: albumInfo.albumId,
                }),
            });
        })
        .then(response => response.ok ? response.json() : Promise.reject(new Error(response.statusText)))
        .then(json => {
            if (!_replay && json && json["code"] === overflowCode) {
                requestPhotosFromSpecialAlbum(20, 50)
                    .then(json => detachPhotoFromSpecialAlbum(json.photos.map(item => item.photoId)))
                    .then(json => attachPhotoToSpecialAlbum(pid, uid, true));
            }
        })
        .catch(reason => {
            if (_replay) {
                promise.then(albumInfo => USER_INFO_CACHE.delete(albumInfo.uid));
            }
            return Promise.reject(reason);
        });
}

/**
 * @public
 * @param {string[]} photoIds
 * @param {boolean} [_replay=false]
 * @return {Promise<*, Error>}
 */
export async function detachPhotoFromSpecialAlbum(photoIds, _replay = false) {
    const promise = requestSpecialAlbumId();
    return promise
        .then(albumInfo => {
            return Utils.fetch("http://photo.weibo.com/albums/delete_batch", {
                method: "POST",
                body: Utils.createSearchParams({
                    album_id: albumInfo.albumId,
                    photo_id: photoIds.join(","),
                }),
            })
        })
        .then(response => response.ok ? response.json() : Promise.reject(new Error(response.statusText)))
        .then(json => {
            if (json && json["code"] === 0 && json["result"]) {
                return Promise.resolve(json);
            } else {
                return Promise.reject(new Error("Invalid Data"));
            }
        })
        .catch(reason => {
            if (_replay) {
                promise.then(albumInfo => USER_INFO_CACHE.delete(albumInfo.uid));
                return Promise.reject(reason);
            } else {
                return requestSignIn(true).then(json => {
                    if (json.login) {
                        return detachPhotoFromSpecialAlbum(photoIds, true);
                    } else {
                        return Promise.reject(reason);
                    }
                });
            }
        });
}

/**
 * @public
 * @param {number} page
 * @param {number} count
 * @param {boolean} [_replay=false]
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
export async function requestPhotosFromSpecialAlbum(page, count, _replay = false) {
    const promise = requestSpecialAlbumId();
    return promise
        .then(albumInfo => {
            return Utils.fetch(Utils.buildURL("http://photo.weibo.com/photos/get_all", {
                page: page,
                count: count,
                album_id: albumInfo.albumId,
                __rnd: Date.now(),
            }));
        })
        .then(response => {
            return response.ok ? response.json() : Promise.reject(new Error(response.statusText));
        })
        .then(json => {
            if (json && json["code"] === 0 && json["result"]) {
                const total = json["data"]["total"];
                const photos = [];
                for (const item of json["data"]["photo_list"]) {
                    photos.push({
                        albumId: item["album_id"],
                        photoId: item["photo_id"],
                        picHost: item["pic_host"],
                        picName: item["pic_name"],
                        updated: item["updated_at"],
                    });
                }
                logger.add({
                    module: "requestPhotosFromSpecialAlbum",
                    message: "获取微相册的全部图片成功",
                });
                return {total, photos};
            } else {
                logger.add({
                    module: "requestPhotosFromSpecialAlbum",
                    message: "获取微相册的全部图片失败，数据异常",
                    remark: JSON.stringify(json),
                }, "warn");
                return Promise.reject(new Error("Invalid Data"));
            }
        })
        .catch(reason => {
            if (_replay) {
                promise.then(albumInfo => USER_INFO_CACHE.delete(albumInfo.uid));
                logger.add({
                    module: "requestPhotosFromSpecialAlbum",
                    message: reason,
                    remark: "已经重试过了，这里直接抛出错误",
                }, "warn");
                return Promise.reject(reason);
            } else {
                return requestSignIn(true).then(json => {
                    if (json.login) {
                        logger.add({
                            module: "requestPhotosFromSpecialAlbum",
                            message: "用户登录状态已被激活，重新尝试获取微相册的全部图片",
                        });
                        return requestPhotosFromSpecialAlbum(page, count, true);
                    } else {
                        logger.add({
                            module: "requestPhotosFromSpecialAlbum",
                            message: "用户处于登出状态，中止重试操作",
                            remark: JSON.stringify(json),
                        }, "warn");
                        return Promise.reject(reason);
                    }
                });
            }
        });
}
