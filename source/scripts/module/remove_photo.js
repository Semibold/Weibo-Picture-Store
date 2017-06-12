/**
 * Remove Photo
 */
{

    const url = "http://photo.weibo.com/albums/delete_batch";
    const doneCode = 0;

    /**
     * @param {String} albumId
     * @param {String|Array<String>} photoId
     * @param {Boolean} [replay]
     */
    Weibo.removePhoto = (albumId, photoId, replay) => {
        let pretty = Array.isArray(photoId) ? photoId : [photoId];

        if (!albumId || !photoId || Array.isArray(photoId) && !photoId.length) {
            return Promise.reject();
        }

        return Utils.fetch(url, {
            method: "POST",
            body: Utils.createSearchParams({
                album_id: albumId,
                photo_id: pretty.join(","),
            }),
        }).then(response => {
            return response.ok ? response.json() : Promise.reject();
        }).then(result => {
            if (result && result.code === doneCode && result.result) {
                return result;
            } else {
                return Promise.reject();
            }
        }).catch(reason => {
            if (replay) {
                return Promise.reject(reason);
            } else {
                return Weibo.setStatus().then(result => result.login ? Weibo.removePhoto(albumId, photoId, true) : Promise.reject(reason));
            }
        });
    };

}
