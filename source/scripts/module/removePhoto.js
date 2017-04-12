/**
 * Remove Photo
 */
{

    const url = "http://photo.weibo.com/albums/delete_batch";
    const doneCode = 0;

    Weibo.removePhoto = (albumId, photoIdArray, replay) => {
        if (!albumId || !photoIdArray) return Promise.reject();
        if (Array.isArray(photoIdArray) && !photoIdArray.length) return Promise.reject();

        let pretty = Array.isArray(photoIdArray) ? photoIdArray : [photoIdArray];

        return fetch(url, Utils.blendParams({
            method: "POST",
            body: Utils.createSearchParams({
                album_id: albumId,
                photo_id: pretty.join(","),
            }),
        })).then(response => {
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
                return Utils.singleton(Weibo.setStatus).then(result => result.login ? Weibo.removePhoto(albumId, photoIdArray, true) : Promise.reject(reason));
            }
        });
    };

}
