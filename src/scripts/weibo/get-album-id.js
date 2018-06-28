/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * Referer wanted: "http://photo.weibo.com/${uid}/client"
 */
import {Utils} from "../sharre/utils.js";
import {checkAlbumId} from "./check-album-id.js";
import {FEATURE_ID} from "../sharre/constant.js";
import {USER_INFO_CACHE} from "../sharre/constant.js";

const url = "http://photo.weibo.com/albums/create";

async function createNewAlbumRequest() {
    const method = "POST";
    const body = Utils.createSearchParams({
        property: "2",
        caption: "Weibo_Chrome",
        description: FEATURE_ID,
        answer: "",
        question: "",
        album_id: "",
    });
    return Utils.fetch(url, {method, body}).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.result) {
            return {
                albumId: json.data.album_id.toString(),
            };
        } else {
            return Promise.reject("Invalid Data");
        }
    });
}

/**
 * @async
 * @return {Promise<{albumId: string}>}
 */
export async function getAlbumId(uid = null) {
    if (uid && USER_INFO_CACHE.has(uid)) {
        const albumInfo = USER_INFO_CACHE.get(uid);
        if (albumInfo && albumInfo.albumId) {
            return Promise.resolve(albumInfo);
        }
    }
    return checkAlbumId().catch(reason => {
        if (reason && reason.canCreateNewAlbum) {
            return Utils.singleton(createNewAlbumRequest);
        } else {
            return Promise.reject(reason);
        }
    });
}
