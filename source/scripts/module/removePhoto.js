/**
 * Remove Photo
 */
{

    const url = "http://photo.weibo.com/albums/delete_batch";
    const doneCode = 0;

    Weibo.removePhoto = (albumId, photoIds) => {
        if (!albumId || !photoIds) return Promise.reject();
        if (Array.isArray(photoIds) && !photoIds.length) return Promise.reject();

        let pretty = Array.isArray(photoIds) ? photoIds : [photoIds];

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
            Weibo.getStatus(true);
            return Promise.reject(reason);
        });
    };

}
