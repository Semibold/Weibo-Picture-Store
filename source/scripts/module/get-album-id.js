{

    /**
     * Referer Wanted: "http://photo.weibo.com/${uid}/client"
     */
    const url = "http://photo.weibo.com/albums/create";
    const createNewAlbumRequest = () => {
        const method = "POST";
        const body = Utils.createSearchParams(Weibo.distinctProp);
        return Utils.fetch(url, {method, body}).then(response => {
            return response.ok ? response.json() : Promise.reject(response.status);
        }).then(json => {
            if (json && json.result) {
                return {
                    albumId: json.data.album_id.toString(),
                };
            } else {
                return Promise.reject("Invalid Data");
            }
        });
    };

    Weibo.getAlbumId = (uid = null) => {
        if (uid && MULTIPLE_USER_CACHE.has(uid)) {
            const albumInfo = MULTIPLE_USER_CACHE.get(uid);
            if (albumInfo && albumInfo.albumId) {
                return Promise.resolve(albumInfo);
            }
        }
        return Weibo.checkAlbumId().catch(reason => {
            if (reason && reason.canCreateNewAlbum) {
                return Utils.singleton(createNewAlbumRequest);
            } else {
                return Promise.reject(reason);
            }
        });
    };

}
