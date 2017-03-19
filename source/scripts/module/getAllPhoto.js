/**
 * Get All Photo
 */
{

    const url = "http://photo.weibo.com/photos/get_all";
    const doneCode = 0;

    Weibo.getAllPhoto = (page, count) => {
        return new Promise((resolve, reject) => {
            try {
                let albumId = JSON.parse(sessionStorage.getItem("albumId"));
                albumId ? resolve(albumId) : reject();
            } catch (e) {
                reject();
            }
        }).catch(reason => {
            return Weibo.getAlbumId();
        }).then(albumId => {
            try {
                sessionStorage.setItem("albumId", JSON.stringify(albumId));
            } catch (e) {}
            return fetch(Utils.createURL(url, {
                page: page || 1,
                count: count || 20,
                album_id: albumId,
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
            try {
                sessionStorage.removeItem("albumId");
            } catch (e) {}
            Weibo.getStatus(true);
            return Promise.reject(reason);
        });
    };

}
