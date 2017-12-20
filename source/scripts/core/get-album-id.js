/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * Referer Wanted: "http://photo.weibo.com/${uid}/client"
 */
import {MULTIPLE_USER_CACHE} from "../base/constant.js";
import {Utils} from "../base/utils.js";
import {distinctProp} from "../base/register.js";
import {checkAlbumId} from "./check-album-id.js";

const url = "http://photo.weibo.com/albums/create";
const createNewAlbumRequest = () => {
    const method = "POST";
    const body = Utils.createSearchParams(distinctProp);
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
};

export const getAlbumId = (uid = null) => {
    if (uid && MULTIPLE_USER_CACHE.has(uid)) {
        const albumInfo = MULTIPLE_USER_CACHE.get(uid);
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
};
Utils.sharre(getAlbumId);
