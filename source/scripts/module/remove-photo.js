{

    const url = "http://photo.weibo.com/albums/delete_batch";
    const doneCode = 0;

    Weibo.removePhoto = (albumId, photoIds, replay) => {
        if (!albumId || !Array.isArray(photoIds) || !photoIds.length) {
            return Promise.reject("Invalid Params");
        }

        return Utils.fetch(url, {
            method: "POST",
            body: Utils.createSearchParams({
                album_id: albumId,
                photo_id: photoIds.join(","),
            }),
        }).then(response => {
            return response.ok ? response.json() : Promise.reject(response.status);
        }).then(json => {
            if (json && json.code === doneCode && json.result) {
                return json;
            } else {
                return Promise.reject("Invalid Data");
            }
        }).catch(reason => {
            if (replay) {
                return Promise.reject(reason);
            } else {
                return Weibo.setStatus().then(json => {
                    if (json.login) {
                        return Weibo.removePhoto(albumId, photoIds, true);
                    } else {
                        return Promise.reject(reason);
                    }
                });
            }
        });
    };

}
