/**
 * Add Picture to Weibo Album
 */
{

    const doneCode = 0;
    const overflowCode = 11112;
    const overflowNumber = 1000; // 相册的最大存储量
    const url = "http://photo.weibo.com/upload/photo";

    Weibo.pidUpload = (obj, retry) => {
        let uid = obj.uid;
        let pid = obj.pid;
        let getAlbumId = Weibo.getAlbumId(uid);

        getAlbumId.then(result => {
            return fetch(url, Utils.blendParams({
                method: "POST",
                body: Utils.createSearchParams({
                    pid: pid,
                    isOrig: 1,
                    album_id: result.albumId,
                }),
            }));
        }).then(response => {
            return response.ok ? response.json() : Promise.reject();
        }).then(result => {
            if (result && result.code === doneCode && result.result) {
                return getAlbumId;
            } else {
                if (!retry && result && result.code === overflowCode) {
                    return Utils.singleton(Weibo.getAllPhoto, null, 20, 50)
                        .then(result => Weibo.removePhoto(result.albumId, result.list.map(item => item.photoId)))
                        .then(result => Weibo.pidUpload(obj, true))
                        .then(result => getAlbumId);
                } else {
                    return Promise.reject();
                }
            }
        }).then(result => {
            uid && chrome.storage.sync.set({
                [uid]: {uid: uid, albumId: result.albumId},
            }, () => chrome.runtime.lastError && console.warn(chrome.runtime.lastError));
            console.info("Workflow Ended: done");
        }, reason => {
            uid && chrome.storage.sync.remove(uid, () => {
                chrome.runtime.lastError && console.warn(chrome.runtime.lastError);
            });
            console.warn("Workflow Ended: fail");
        });
    };

}
