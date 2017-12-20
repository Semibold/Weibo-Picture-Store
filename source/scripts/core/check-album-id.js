/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../base/utils.js";
import {distinctProp} from "../base/register.js";

const overflow = 100;
const url = "http://photo.weibo.com/albums/get_all";

const checkAlbumIdRequest = () => {
    return Utils.fetch(Utils.buildURL(url, {page: 1, count: overflow})).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.result) {
            const albumInfo = {
                counter: 0,
                albumId: null,
            };

            for (const item of json.data.album_list) {
                albumInfo.counter++;
                if (item.description === distinctProp.description) {
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
};

export const checkAlbumId = () => Utils.singleton(checkAlbumIdRequest);
Utils.sharre(checkAlbumId);
