/**
 * Add Picture to Weibo Album
 */
{

    const doneCode = 0;
    const url = "http://photo.weibo.com/upload/photo";

    Weibo.pidUpload = (obj) => {
        let uid = obj.uid;
        let pid = obj.pid;

        if (!pid) return;
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
                return Promise.reject();
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
