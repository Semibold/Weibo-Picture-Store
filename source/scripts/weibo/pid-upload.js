/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {USER_INFO_CACHE} from "./channel.js";
import {Utils} from "../sharre/utils.js";
import {getAlbumId} from "./get-album-id.js";
import {removePhoto} from "./remove-photo.js";
import {getAllPhoto} from "./get-all-photo.js";

const doneCode = 0;
const overflowCode = 11112;
const overflowNumber = 1000; // 相册的最大存储量
const url = "http://photo.weibo.com/upload/photo";

/**
 * @async
 */
export async function pidUpload(pid, uid, retry) {
    const albumInfoPromise = getAlbumId(uid);

    albumInfoPromise.then(albumInfo => {
        return Utils.fetch(url, {
            method: "POST",
            body: Utils.createFormData({
                pid: pid,
                isOrig: 1,
                album_id: albumInfo.albumId,
            }),
        });
    }).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.code === doneCode && json.result) {
            albumInfoPromise.then(albumInfo => {
                uid && USER_INFO_CACHE.set(uid, albumInfo);
            }).catch(reason => {
                uid && USER_INFO_CACHE.delete(uid);
            });
        } else {
            if (!retry && json && json.code === overflowCode) {
                albumInfoPromise.then(albumInfo => getAllPhoto(albumInfo, 20, 50))
                    .then(json => removePhoto(json.albumId, json.list.map(item => item.photoId)))
                    .then(json => pidUpload(pid, uid, true));
            }
        }
    }).catch(Utils.noop);
}
