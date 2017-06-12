/**
 * Get All Photo
 */
{

    const url = "http://photo.weibo.com/photos/get_all";
    const doneCode = 0;

    /**
     * @param {Object} [albumInfo]
     * @param {String} albumInfo.albumId
     * @param {Number} [page = 1]
     * @param {Number} [count = 20]
     * @param {Boolean} [replay]
     */
    Weibo.getAllPhoto = (albumInfo, page, count, replay) => {
        return new Promise((resolve, reject) => {
            albumInfo ? resolve(albumInfo) : reject();
        }).catch(reason => {
            return Weibo.getAlbumId();
        }).then(result => {
            return Utils.fetch(Utils.createURL(url, {
                page: page || 1,
                count: count || 20,
                album_id: result.albumId,
            }));
        }).then(response => {
            return response.ok ? response.json() : Promise.reject();
        }).then(result => {
            if (result && result.code === doneCode && result.result) {
                let list = [];
                for (let item of result.data.photo_list) {
                    list.push({
                        pid: item.pid,
                        photoId: item.photo_id,
                        picHost: item.pic_host,
                        picName: item.pic_name,
                        created: item.created_at,
                    });
                }
                return {
                    list: list,
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
                return Weibo.setStatus().then(result => result.login ? Weibo.getAllPhoto(albumInfo, page, count, true) : Promise.reject(reason));
            }
        });
    };

}
