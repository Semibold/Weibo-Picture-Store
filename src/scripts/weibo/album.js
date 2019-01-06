/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { FEATURE_ID } from "../sharre/constant.js";
import { USER_INFO_CACHE, USER_INFO_EXPIRED } from "../sharre/constant.js";
import { requestUserId } from "./author.js";
import { Log } from "../sharre/log.js";

/**
 * @desc Singleton
 * @typedef {Object} AlbumInfo
 * @property {string} uid
 * @property {string} albumId
 * @property {*[]} albumList
 *
 * @return {Promise<AlbumInfo>}
 * @reject {{canCreateNewAlbum: boolean}|Error}
 */
async function tryCheckoutSpecialAlbumId() {
    const overflow = 100;
    return Utils.fetch(
        Utils.buildURL("http://photo.weibo.com/albums/get_all", { page: 1, count: overflow, __rnd: Date.now() }),
    )
        .then(response => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
        .catch(reason => {
            Log.e({
                module: "tryCheckoutSpecialAlbumId",
                message: reason,
                remark: "用户帐号可能处于异常状态，访问 http://photo.weibo.com 以确认账号状态",
            });
            return Promise.reject(reason);
        })
        .then(json => {
            if (json && json["result"]) {
                const albumInfo = { uid: null, albumId: null };
                // 从新到旧排序
                const albumList = json["data"]["album_list"]
                    .filter(info => info["description"] === FEATURE_ID)
                    .sort((prev, next) => Number(next["timestamp"]) - Number(prev["timestamp"]));
                const total = Math.max(json["data"]["total"], json["data"]["album_list"].length);

                for (const item of albumList) {
                    if (item["description"] === FEATURE_ID) {
                        albumInfo.uid = item["uid"].toString();
                        albumInfo.albumId = item["album_id"].toString();
                        break;
                    }
                }

                if (albumInfo.albumId) {
                    Log.d({
                        module: "CheckoutSpecialAlbumId",
                        message: "检出指定的微相册成功",
                    });
                    return Promise.resolve({
                        uid: albumInfo.uid,
                        albumId: albumInfo.albumId,
                        albumList,
                    });
                } else {
                    const canCreateNewAlbum = total < overflow;
                    Log.w({
                        module: "CheckoutSpecialAlbumId",
                        message: "没有检测到指定的微相册",
                        remark: `能否创建新的微相册：${canCreateNewAlbum}`,
                    });
                    return Promise.reject({ canCreateNewAlbum });
                }
            } else {
                Log.e({
                    module: "CheckoutSpecialAlbumId",
                    message: "检出指定的微相册失败，数据异常",
                    remark: json,
                });
                return Promise.reject(new Error("Invalid Data"));
            }
        });
}

/**
 * @desc Singleton
 * @desc Referer wanted: "${protocol}//photo.weibo.com/${uid}/client"
 * @return {Promise<{uid: string, albumId: string}>}
 * @reject {Error}
 */
async function tryCreateNewAlbum() {
    const method = "POST";
    const body = Utils.createSearchParams({
        property: "2",
        caption: "Weibo_Chrome",
        description: FEATURE_ID,
        answer: "",
        question: "",
        album_id: "",
    });
    return Utils.fetch("http://photo.weibo.com/albums/create", { method, body })
        .then(response => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
        .catch(reason => {
            Log.e({
                module: "tryCreateNewAlbum",
                message: reason,
                remark: "用户帐号可能处于异常状态，访问 http://photo.weibo.com 以确认账号状态",
            });
            return Promise.reject(reason);
        })
        .then(json => {
            if (json && json["result"]) {
                Log.d({
                    module: "CreateNewAlbum",
                    message: "创建微相册成功",
                });
                return {
                    uid: json["data"]["uid"].toString(),
                    albumId: json["data"]["album_id"].toString(),
                };
            } else {
                Log.e({
                    module: "CreateNewAlbum",
                    message: "创建微相册失败，数据异常",
                    remark: json,
                });
                return Promise.reject(new Error("Invalid Data"));
            }
        });
}

/**
 * @param {AlbumInfo} albumInfo
 * @return {AlbumInfo}
 */
function setUserInfoCache(albumInfo) {
    if (albumInfo && albumInfo.albumId && albumInfo.uid) {
        USER_INFO_CACHE.set(
            albumInfo.uid,
            Object.assign(
                {
                    timestamp: Date.now(),
                },
                albumInfo,
            ),
        );
    }
    return albumInfo;
}

/**
 * @export
 * @param {string} [uid]
 * @param {boolean} [forceCreateNewAlbum]
 * @return {Promise<AlbumInfo>}
 * @reject {Error}
 */
export async function requestSpecialAlbumId(uid, forceCreateNewAlbum) {
    if (forceCreateNewAlbum) {
        return Utils.singleton(tryCreateNewAlbum)
            .then(tinyAlbumInfo => Utils.singleton(tryCheckoutSpecialAlbumId))
            .then(setUserInfoCache);
    }
    const cacheId =
        uid ||
        (await requestUserId()
            .then(info => info.uid)
            .catch(Utils.noop));

    if (cacheId && USER_INFO_CACHE.has(cacheId)) {
        const albumInfo = USER_INFO_CACHE.get(cacheId);
        if (
            albumInfo &&
            albumInfo.albumId &&
            albumInfo.uid === cacheId &&
            Date.now() - albumInfo.timestamp < USER_INFO_EXPIRED
        ) {
            return Promise.resolve(albumInfo);
        } else {
            USER_INFO_CACHE.delete(cacheId);
        }
    }

    return Utils.singleton(tryCheckoutSpecialAlbumId)
        .catch(reason => {
            if (reason && reason.canCreateNewAlbum != null) {
                if (reason.canCreateNewAlbum) {
                    // Always return tryCheckoutSpecialAlbumId result.
                    return Utils.singleton(tryCreateNewAlbum).then(tinyAlbumInfo =>
                        Utils.singleton(tryCheckoutSpecialAlbumId),
                    );
                } else {
                    return Promise.reject(new Error("Cannot create new album"));
                }
            } else {
                return Promise.reject(reason);
            }
        })
        .then(setUserInfoCache);
}
