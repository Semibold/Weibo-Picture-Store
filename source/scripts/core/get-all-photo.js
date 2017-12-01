import {Utils} from "../base/utils.js";
import {setStatus} from "./set-status.js";
import {getAlbumId} from "./get-album-id.js";

const url = "http://photo.weibo.com/photos/get_all";
const doneCode = 0;

export const getAllPhoto = (albumInfo, page, count, replay) => {
    return new Promise((resolve, reject) => {
        if (albumInfo && albumInfo.albumId) {
            resolve(albumInfo);
        } else {
            reject("Invalid Data");
        }
    }).catch(reason => {
        return getAlbumId();
    }).then(albumInfo => {
        return Utils.fetch(Utils.buildURL(url, {
            page: page || 1,
            count: count || 20,
            album_id: albumInfo.albumId,
        }));
    }).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.code === doneCode && json.result) {
            const list = [];
            const total = json.data.total;
            const albumId = json.data.album_id;

            for (const item of json.data.photo_list) {
                list.push({
                    pid: item.pid,
                    photoId: item.photo_id,
                    picHost: item.pic_host,
                    picName: item.pic_name,
                    created: item.created_at,
                });
            }

            return {list, total, albumId};
        } else {
            return Promise.reject("Invalid Data");
        }
    }).catch(reason => {
        if (replay) {
            return Promise.reject(reason);
        } else {
            return setStatus().then(json => {
                if (json.login) {
                    return getAllPhoto(albumInfo, page, count, true);
                } else {
                    return Promise.reject(reason);
                }
            });
        }
    });
};
Utils.sharre(getAllPhoto);
