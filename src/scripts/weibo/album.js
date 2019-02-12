/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { E_CANT_CREATE_PALBUM, E_INVALID_PARSED_DATA, FEATURE_ID } from "../sharre/constant.js";
import { singleton, setUserInfoCache, getUserInfoCache } from "./banker.js";
import { requestUserId } from "./author.js";
import { Log } from "../sharre/log.js";

/**
 * Singleton
 *
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
    const url = Utils.buildURL("http://photo.weibo.com/albums/get_all", {
        page: 1,
        count: overflow,
        __rnd: Date.now(),
    });
    return Utils.fetch(url)
        .then(response => response.json())
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
                    return Object.assign({ albumList }, albumInfo);
                } else {
                    const canCreateNewAlbum = total < overflow;
                    Log.w({
                        module: "CheckoutSpecialAlbumId",
                        message: "没有检测到指定的微相册",
                        remark: `能否创建新的微相册：${canCreateNewAlbum}，当前相册总数：${total}`,
                    });
                    return Promise.reject({ canCreateNewAlbum });
                }
            } else {
                Log.e({
                    module: "CheckoutSpecialAlbumId",
                    message: "检出指定的微相册失败，数据异常",
                    remark: json,
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        });
}

/**
 * Singleton
 * Referer wanted: "${protocol}//photo.weibo.com/${uid}/client"
 *
 * @return {Promise<{uid: string, albumId: string}>}
 * @reject {Error}
 */
async function tryCreateNewAlbum() {
    const d = new Date();
    const method = "POST";
    const body = Utils.createSearchParams({
        property: "2",
        caption: `Weibo_Chrome_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
        description: FEATURE_ID,
        answer: "",
        question: "",
        album_id: "",
    });
    return Utils.fetch("http://photo.weibo.com/albums/create", { method, body })
        .then(response => response.json())
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
                throw new Error(E_INVALID_PARSED_DATA);
            }
        });
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
        return singleton(tryCreateNewAlbum)
            .then(tinyAlbumInfo => singleton(tryCheckoutSpecialAlbumId))
            .then(setUserInfoCache);
    }
    const cacheId =
        uid ||
        (await requestUserId()
            .then(info => info.uid)
            .catch(Utils.noop));
    const albumInfo = getUserInfoCache(cacheId);

    if (albumInfo) return albumInfo;

    return singleton(tryCheckoutSpecialAlbumId)
        .catch(reason => {
            if (reason && reason.canCreateNewAlbum != null) {
                if (reason.canCreateNewAlbum) {
                    // Always return tryCheckoutSpecialAlbumId result.
                    return singleton(tryCreateNewAlbum).then(tinyAlbumInfo => singleton(tryCheckoutSpecialAlbumId));
                } else {
                    throw new Error(E_CANT_CREATE_PALBUM);
                }
            } else {
                return Promise.reject(reason);
            }
        })
        .then(setUserInfoCache);
}
