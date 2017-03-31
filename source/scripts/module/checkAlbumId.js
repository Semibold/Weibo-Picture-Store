/**
 * Check Album ID
 */
{

    const overflow = 100;
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

                return dict;
            } else {
                return Promise.reject();
            }
        }).catch(Utils.noop);
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
            let dict = {albumId: null};

            for (let item of list) {
                if (item) {
                    total -= item.counter;
                    if (item.albumId[albumId]) {
                        dict.albumId = item.albumId[albumId];
                        break;
                    }
                    if (item.standby) {
                        dict.albumId = item.standby;
                    }
                }
            }

            return dict.albumId ? dict : Promise.reject(Boolean(total && total !== overflow));
        });
    };

}
