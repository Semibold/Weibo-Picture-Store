/**
 * Get Album ID
 */
{

    Weibo.getAlbumId = (uid) => {
        return new Promise((resolve, reject) => {
            if (uid) {
                chrome.storage.sync.get(uid, obj => {
                    chrome.runtime.lastError && console.warn(chrome.runtime.lastError);

                    if (obj[uid] && obj[uid].albumId) {
                        resolve(obj[uid].albumId);
                    } else {
                        reject();
                    }
                });
            } else {
                reject();
            }
        }).catch(reason => {
            return Weibo.checkAlbumId();
        }).catch(reason => {
            return reason === true ? Weibo.createAlbum() : Promise.reject();
        });
    };

}
