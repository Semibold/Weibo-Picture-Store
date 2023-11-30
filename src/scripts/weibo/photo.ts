/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { delUserInfoCache } from "./banker.js";
import { requestSpecialAlbumId } from "./album.js";
import { requestSignIn } from "./author.js";
import { E_INVALID_PARSED_DATA } from "../sharre/constant.js";

/**
 * @export
 * @reject {Error}
 */
export async function attachPhotoToSpecialAlbum(pid: string, uid?: string, _replay = false): Promise<void> {
    const overflow = 1000; // 单个相册的最大存储量
    const overflowCode = 11112; // 相册存储量溢出时的返回码
    const promise = requestSpecialAlbumId(uid, _replay);
    return promise
        .then((albumInfo) => {
            return Utils.fetch("https://photo.weibo.com/upload/photo", {
                method: "POST",
                body: Utils.createSearchParams({
                    pid: pid,
                    isOrig: 1,
                    album_id: albumInfo.albumId,
                }),
            });
        })
        .then((response) => response.json())
        .then((json) => {
            if (!_replay && json && json["code"] === overflowCode) {
                attachPhotoToSpecialAlbum(pid, uid, true);
            }
        })
        .catch((reason) => {
            if (_replay) {
                promise.then((albumInfo) => delUserInfoCache(albumInfo.uid));
            }
            return Promise.reject(reason);
        });
}

/**
 * @export
 * @reject {Error}
 */
export async function detachPhotoFromSpecialAlbum(
    photoIds: string[],
    albumId?: string,
    _replay = false,
): Promise<unknown> {
    const promise = requestSpecialAlbumId();
    return promise
        .then((albumInfo) => {
            return Utils.fetch("https://photo.weibo.com/albums/delete_batch", {
                method: "POST",
                body: Utils.createSearchParams({
                    album_id: albumId || albumInfo.albumId,
                    photo_id: photoIds.join(","),
                }),
            });
        })
        .then((response) => response.json())
        .then((json) => {
            if (json && json["code"] === 0 && json["result"]) {
                return json;
            } else {
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch((reason) => {
            if (_replay) {
                promise.then((albumInfo) => delUserInfoCache(albumInfo.uid));
                return Promise.reject(reason);
            } else {
                return requestSignIn(true).then((json) => {
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
 * @reject {Error}
 */
export async function requestPhotosFromSpecialAlbum(
    page: number,
    count: number,
    albumId?: string,
    _replay = false,
): Promise<WB.AlbumContents> {
    const promise = requestSpecialAlbumId();
    const albumList: unknown[] = [];
    return promise
        .then((albumInfo) => {
            if (Array.isArray(albumInfo.albumList)) {
                albumList.push(...albumInfo.albumList);
            }
            return Utils.fetch(
                Utils.buildURL("https://photo.weibo.com/photos/get_all", {
                    page: page,
                    count: count,
                    album_id: albumId || albumInfo.albumId,
                    __rnd: Date.now(),
                }),
            );
        })
        .then((response) => response.json())
        .then((json) => {
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
                Utils.log.d({
                    module: "requestPhotosFromSpecialAlbum",
                    remark: "获取微相册的全部图片成功",
                });
                return { albumList, total, albumId, photos };
            } else {
                Utils.log.w({
                    module: "requestPhotosFromSpecialAlbum",
                    error: json,
                    remark: "获取微相册的全部图片失败，数据异常",
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch((reason) => {
            if (_replay) {
                promise.then((albumInfo) => delUserInfoCache(albumInfo.uid));
                Utils.log.w({
                    module: "requestPhotosFromSpecialAlbum",
                    error: reason,
                });
                return Promise.reject(reason);
            } else {
                return requestSignIn(true).then((json) => {
                    if (json.login) {
                        Utils.log.d({
                            module: "requestPhotosFromSpecialAlbum",
                            remark: "用户登录状态已被激活，重新尝试获取微相册的全部图片",
                        });
                        return requestPhotosFromSpecialAlbum(page, count, albumId, true);
                    } else {
                        Utils.log.w({
                            module: "requestPhotosFromSpecialAlbum",
                            error: json,
                            remark: "用户处于登出状态，中止重试操作",
                        });
                        return Promise.reject(reason);
                    }
                });
            }
        });
}
