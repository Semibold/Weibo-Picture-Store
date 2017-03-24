/**
 * Get All Photo
 */
{

    const url = "http://photo.weibo.com/photos/get_all";
    const sessionKey = "albumInfo";
    const doneCode = 0;

    Weibo.getAllPhoto = (page, count) => {
        return new Promise((resolve, reject) => {
            let result = Utils.session.get(sessionKey);
            result ? resolve(result) : reject();
        }).catch(reason => {
            return Weibo.getAlbumId();
        }).then(result => {
            Utils.session.set(sessionKey, result);
            return fetch(Utils.createURL(url, {
                page: page || 1,
                count: count || 20,
                album_id: result.albumId,
            }), Utils.blendParams());
        }).then(response => {
            return response.ok ? response.json() : Promise.reject();
        }).then(result => {
            if (result && result.code === doneCode && result.result) {
                let buffer = [];
                let list = result.data.photo_list;
                for (let item of list) {
                    buffer.push({
                        pid: item.pid,
                        photoId: item.photo_id,
                        picHost: item.pic_host,
                        picName: item.pic_name,
                        created: item.created_at,
                    });
                }
                return {
                    list: buffer,
                    total: result.data.total,
                    albumId: result.data.album_id,
                };
            } else {
                return Promise.reject();
            }
        }).catch(reason => {
            Utils.session.remove(sessionKey);
            Weibo.getStatus();
            return Promise.reject(reason);
        });
    };

}
