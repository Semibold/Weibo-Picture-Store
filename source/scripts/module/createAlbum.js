/**
 * Singleton
 * Create Album
 * Referer Wanted:
 *     http://photo.weibo.com/${uid}/client
 */
{

    const url = "http://photo.weibo.com/albums/create";

    const createAlbum = () => {
        return fetch(url, Utils.blendParams({
            method: "POST",
            body: Utils.createSearchParams(Weibo.distinctProp),
        })).then(response => {
            return response.ok ? response.json() : Promise.reject();
        }).then(result => {
            if (result && result.result) {
                return {albumId: result.data.album_id.toString()};
            } else {
                return Promise.reject();
            }
        });
    };

    Weibo.createAlbum = (...rift) => Utils.singleton(createAlbum, ...rift);

}
