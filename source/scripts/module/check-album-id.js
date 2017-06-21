{

    const overflow = 100;
    const url = "http://photo.weibo.com/albums/get_all";

    Weibo.checkAlbumId = () => {
        const page = 1;
        const count = overflow;
        const request = () => {
            return Utils.fetch(Utils.buildURL(url, {page, count})).then(response => {
                return response.ok ? response.json() : Promise.reject(response.status);
            }).then(json => {
                if (json && json.result) {
                    const albumInfo = {
                        counter: 0,
                        albumId: null,
                    };

                    for (const item of json.data.album_list) {
                        albumInfo.counter++;
                        if (item.description === Weibo.distinctProp.description) {
                            albumInfo.albumId = item.album_id.toString();
                            break;
                        }
                    }

                    if (albumInfo.albumId) {
                        return Promise.resolve({
                            albumId: albumInfo.albumId,
                        });
                    } else {
                        return Promise.reject({
                            canCreateNewAlbum: albumInfo.counter < overflow,
                        });
                    }
                } else {
                    return Promise.reject("Invalid Data");
                }
            });
        };

        return Utils.singleton(request);
    };

}
