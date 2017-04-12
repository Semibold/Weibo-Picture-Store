/**
 * Get All Photo
 */
{

    const url = "http://photo.weibo.com/photos/get_all";
    const doneCode = 0;

    Weibo.getAllPhoto = (albumInfo, page, count, replay) => {
        return new Promise((resolve, reject) => {
            albumInfo ? resolve(albumInfo) : reject();
        }).catch(reason => {
            return Weibo.getAlbumId();
        }).then(result => {
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
            if (replay) {
                return Promise.reject(reason);
            } else {
                return Utils.singleton(Weibo.setStatus).then(result => result.login ? Weibo.getAllPhoto(albumInfo, page, count, true) : Promise.reject(reason));
            }
        });
    };

}
