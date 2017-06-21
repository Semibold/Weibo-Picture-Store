{

    /**
     * Referer Wanted: "http://photo.weibo.com/${uid}/client"
     */
    const url = "http://photo.weibo.com/albums/create";
    const createNewAlbum = () => {
        const method = "POST";
        const body = Utils.createSearchParams(Weibo.distinctProp);
        const request = () => {
            return Utils.fetch(url, {method, body})
                .then(response => {
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

        return Utils.singleton(request);
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
                return createNewAlbum();
            } else {
                return Promise.reject(reason);
            }
        });
    };

}
