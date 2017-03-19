/**
 * Check Album ID
 */
{

    const overflow = 100;
    const sid = Utils.randomString(16);
    const url = "http://photo.weibo.com/albums/get_all";

    const erupt = (page, count) => {
        return fetch(Utils.createURL(url, {
            page,
            count,
        }), Utils.blendParams()).then(response => {
            return response.ok ? response.json() : Promise.reject();
        }).then(result => {
            if (result && result.result) {
                let dict = {
                    sid: sid,
                    albumId: {},
                    standby: null,
                    counter: 0,
                };

                for (let item of result.data.album_list) {
                    dict.counter++;
                    dict.albumId[item.album_id] = item.album_id;
                    if (item.description === Weibo.distinctProp.description && !dict.standby) {
                        dict.standby = item.album_id.toString();
                    }
                }

                return Promise.reject(dict);
            } else {
                return Promise.reject();
            }
        }).catch(reason => reason && reason.sid === sid ? reason : null);
    };

    Weibo.checkAlbumId = (albumId) => {
        let count = 50;
        let pages = Math.ceil(overflow / count);
        let buffer = [];

        for (let i = pages; i > 0; i--) {
            buffer.push(erupt(i, count));
        }

        return Promise.all(buffer).then(list => {
            let total = overflow;
            let dict = {
                albumId: null,
                standby: null,
            };

            for (let item of list) {
                if (item && item.sid === sid) {
                    total -= item.counter;
                    if (item.albumId[albumId]) {
                        dict.albumId = item.albumId[albumId];
                        break;
                    }
                    if (item.standby) {
                        dict.standby = item.standby;
                    }
                }
            }

            if (dict.albumId) {
                return dict.albumId;
            } else {
                return dict.standby ? dict.standby : Promise.reject(Boolean(total));
            }
        });
    };

}
