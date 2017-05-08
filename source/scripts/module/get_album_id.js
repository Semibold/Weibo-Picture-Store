/**
 * Get Album ID
 */
{

    Weibo.getAlbumId = (uid) => new Promise((resolve, reject) => {
        uid ? chrome.storage.local.get(uid, obj => {
            chrome.runtime.lastError && console.warn(chrome.runtime.lastError);
            obj[uid] && obj[uid].albumId ? resolve({albumId: obj[uid].albumId}) : reject();
        }) : reject();
    }).catch(reason => {
        return Weibo.checkAlbumId();
    }).catch(reason => {
        return reason ? Weibo.createAlbum() : Promise.reject();
    });

}
