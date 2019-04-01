/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { delUserInfoCache } from "./banker.js";
import { requestSpecialAlbumId } from "./album.js";
import { requestSignIn } from "./author.js";
import { Log } from "../sharre/log.js";
import { E_INVALID_PARSED_DATA } from "../sharre/constant.js";

/**
 * @export
 * @param {string} pid
 * @param {string} [uid]
 * @param {boolean} [_replay=false]
 * @return {Promise<void>}
 * @reject {Error}
 */
export async function attachPhotoToSpecialAlbum(pid, uid, _replay = false) {
    const overflow = 1000; // 相册的最大存储量
    const overflowCode = 11112; // 相册存储量溢出时的返回码
    const promise = requestSpecialAlbumId(uid, _replay);
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
        .then(response => response.json())
        .then(json => {
            if (!_replay && json && json["code"] === overflowCode) {
                attachPhotoToSpecialAlbum(pid, uid, true);
            }
        })
        .catch(reason => {
            if (_replay) {
                promise.then(albumInfo => delUserInfoCache(albumInfo.uid));
            }
            return Promise.reject(reason);
        });
}

/**
 * @export
 * @param {string[]} photoIds
 * @param {string} [albumId]
 * @param {boolean} [_replay=false]
 * @return {Promise<*>}
 * @reject {Error}
 */
export async function detachPhotoFromSpecialAlbum(photoIds, albumId, _replay = false) {
    const promise = requestSpecialAlbumId();
    return promise
        .then(albumInfo => {
            return Utils.fetch("http://photo.weibo.com/albums/delete_batch", {
                method: "POST",
                body: Utils.createSearchParams({
                    album_id: albumId || albumInfo.albumId,
                    photo_id: photoIds.join(","),
                }),
            });
        })
        .then(response => response.json())
        .then(json => {
            if (json && json["code"] === 0 && json["result"]) {
                return json;
            } else {
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch(reason => {
            if (_replay) {
                promise.then(albumInfo => delUserInfoCache(albumInfo.uid));
                return Promise.reject(reason);
            } else {
                return requestSignIn(true).then(json => {
                    if (json.login) {
                        return detachPhotoFromSpecialAlbum(photoIds, albumId, true);
                    } else {
                        return Promise.reject(reason);
                    }
                });
            }
        });
}

/**
 * @export
 * @typedef {Object} AlbumContents
 * @property {number} total
 * @property {string} albumId
 * @property {*[]} albumList
 * @property {Array<Object>} photos[]
 * @property {string} photos.albumId
 * @property {string} photos.photoId
 * @property {string} photos.picHost
 * @property {string} photos.picName
 * @property {string} photos.updated
 *
 * @param {number} page
 * @param {number} count
 * @param {string} [albumId]
 * @param {boolean} [_replay=false]
 * @return {Promise<AlbumContents>}
 * @reject {Error}
 */
export async function requestPhotosFromSpecialAlbum(page, count, albumId, _replay = false) {
    const promise = requestSpecialAlbumId();
    const albumList = [];
    return promise
        .then(albumInfo => {
            if (Array.isArray(albumInfo.albumList)) {
                albumList.push(...albumInfo.albumList);
            }
            return Utils.fetch(
                Utils.buildURL("http://photo.weibo.com/photos/get_all", {
                    page: page,
                    count: count,
                    album_id: albumId || albumInfo.albumId,
                    __rnd: Date.now(),
                }),
            );
        })
        .then(response => response.json())
        .then(json => {
            if (json && json["code"] === 0 && json["result"]) {
                const total = json["data"]["total"];
                const albumId = json["data"]["album_id"];
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
                Log.d({
                    module: "requestPhotosFromSpecialAlbum",
                    message: "获取微相册的全部图片成功",
                });
                return { albumList, total, albumId, photos };
            } else {
                Log.w({
                    module: "requestPhotosFromSpecialAlbum",
                    message: "获取微相册的全部图片失败，数据异常",
                    remark: json,
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch(reason => {
            if (_replay) {
                promise.then(albumInfo => delUserInfoCache(albumInfo.uid));
                Log.w({
                    module: "requestPhotosFromSpecialAlbum",
                    message: reason,
                    remark: "已经重试过了，这里直接抛出错误",
                });
                return Promise.reject(reason);
            } else {
                return requestSignIn(true).then(json => {
                    if (json.login) {
                        Log.d({
                            module: "requestPhotosFromSpecialAlbum",
                            message: "用户登录状态已被激活，重新尝试获取微相册的全部图片",
                        });
                        return requestPhotosFromSpecialAlbum(page, count, albumId, true);
                    } else {
                        Log.w({
                            module: "requestPhotosFromSpecialAlbum",
                            message: "用户处于登出状态，中止重试操作",
                            remark: json,
                        });
                        return Promise.reject(reason);
                    }
                });
            }
        });
}
