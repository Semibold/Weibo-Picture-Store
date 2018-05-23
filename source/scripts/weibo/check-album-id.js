/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {FEATURE_ID} from "../sharre/constant.js";
import {weiboSingleton} from "./channel.js";

const overflow = 100;
const url = "http://photo.weibo.com/albums/get_all";

async function checkAlbumIdRequest() {
    return Utils.fetch(Utils.buildURL(url, {page: 1, count: overflow})).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.result) {
            const albumInfo = {counter: 0, albumId: null};

            for (const item of json.data.album_list) {
                albumInfo.counter++;
                if (item.description === FEATURE_ID) {
                    albumInfo.albumId = item.album_id.toString();
                    break;
                }
            }

            if (albumInfo.albumId) {
                return Promise.resolve({
                    albumId: albumInfo.albumId,
                });
            } else {
                return Promise.reject({
                    canCreateNewAlbum: albumInfo.counter < overflow,
                });
            }
        } else {
            return Promise.reject("Invalid Data");
        }
    });
}

/**
 * @async
 * @return {Promise<{albumId: string}>}
 */
export async function checkAlbumId() {
    return weiboSingleton(checkAlbumIdRequest);
}
