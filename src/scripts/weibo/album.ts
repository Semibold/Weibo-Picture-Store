/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { E_CANT_CREATE_ALBUM, E_INVALID_PARSED_DATA, FEATURE_ID } from "../sharre/constant.js";
import { singleton, setUserInfoCache, getUserInfoCache } from "./banker.js";
import { requestUserId } from "./author.js";

/**
 * Singleton
 *
 * @reject {{canCreateNewAlbum: boolean}|Error}
 */
async function tryCheckoutSpecialAlbumId(): Promise<WB.AlbumInfo> {
    const overflow = 100;
    const url = Utils.buildURL("https://photo.weibo.com/albums/get_all", {
        page: 1,
        count: overflow,
        __rnd: Date.now(),
    });
    return Utils.fetch(url)
        .then((response) => response.json())
        .then((json) => {
            if (json && json["result"]) {
                const albumInfo: WB.AlbumInfo = { uid: null, albumId: null };
                const rawAlbumList: any[] = json["data"]["album_list"];
                // 从新到旧排序
                const albumList = rawAlbumList
                    .filter((info) => info["description"] === FEATURE_ID)
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
                    Utils.log.d({
                        module: "CheckoutSpecialAlbumId",
                        remark: "检出指定的微相册成功",
                    });
                    return Object.assign({ albumList }, albumInfo);
                } else {
                    const canCreateNewAlbum = total < overflow;
                    Utils.log.w({
                        module: "CheckoutSpecialAlbumId",
                        remark: `没有检测到指定的微相册，能否创建新的微相册：${canCreateNewAlbum}，当前相册总数：${total}`,
                    });
                    return Promise.reject({ canCreateNewAlbum });
                }
            } else {
                Utils.log.e({
                    module: "CheckoutSpecialAlbumId",
                    error: json,
                    remark: "检出指定的微相册失败，数据异常",
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        });
}

/**
 * Singleton
 * Referer wanted: "${protocol}//photo.weibo.com/${uid}/client"
 *
 * @reject {Error}
 */
async function tryCreateNewAlbum(): Promise<WB.AlbumInfo> {
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
    return Utils.fetch("https://photo.weibo.com/albums/create", { method, body })
        .then((response) => response.json())
        .then((json) => {
            if (json && json["result"]) {
                Utils.log.d({
                    module: "CreateNewAlbum",
                    remark: "创建微相册成功",
                });
                return {
                    uid: json["data"]["uid"].toString(),
                    albumId: json["data"]["album_id"].toString(),
                };
            } else {
                Utils.log.e({
                    module: "CreateNewAlbum",
                    error: json,
                    remark: "创建微相册失败，数据异常",
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        });
}

/**
 * @reject {Error}
 */
async function createNewAlbumThenCheckoutSpecialAlbumId(): Promise<WB.AlbumInfo> {
    return singleton(tryCreateNewAlbum)
        .then((tinyAlbumInfo) => singleton(tryCheckoutSpecialAlbumId))
        .catch((reason) => {
            if (reason && reason.canCreateNewAlbum != null) {
                throw new Error(JSON.stringify(reason));
            } else {
                throw reason;
            }
        });
}

/**
 * @export
 * @reject {Error}
 */
export async function requestSpecialAlbumId(uid?: string, forceCreateNewAlbum?: boolean): Promise<WB.AlbumInfo> {
    if (forceCreateNewAlbum) {
        return createNewAlbumThenCheckoutSpecialAlbumId().then(setUserInfoCache);
    }

    const cacheId: string =
        uid ||
        (await requestUserId()
            .then((info) => info.uid)
            .catch(Utils.noop));

    const albumInfo = getUserInfoCache(cacheId);

    if (albumInfo) return albumInfo;

    return singleton(tryCheckoutSpecialAlbumId)
        .catch((reason) => {
            if (reason && reason.canCreateNewAlbum != null) {
                if (reason.canCreateNewAlbum) {
                    // Always return tryCheckoutSpecialAlbumId result.
                    return createNewAlbumThenCheckoutSpecialAlbumId();
                } else {
                    throw new Error(E_CANT_CREATE_ALBUM);
                }
            } else {
                return Promise.reject(reason);
            }
        })
        .then(setUserInfoCache);
}
