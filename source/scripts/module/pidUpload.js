/**
 * Add Picture to Weibo Album
 */
{

    const doneCode = 0;
    const url = "http://photo.weibo.com/upload/photo";

    Weibo.pidUpload = (obj) => {
        let uid = obj.uid;
        let pids = obj.pids;

        if (!pids.length) return;
        let getAlbumId = Weibo.getAlbumId(uid);

        for (let pid of pids) {
            getAlbumId.then(albumId => {
                return fetch(url, Utils.blendParams({
                    method: "POST",
                    body: Utils.createSearchParams({
                        album_id: albumId,
                        pid: pid,
                        isOrig: 1,
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
            }).then(albumId => {
                if (uid) {
                    chrome.storage.sync.set({
                        [uid]: {uid, albumId},
                    }, () => chrome.runtime.lastError && console.warn(chrome.runtime.lastError));
                }
                console.info("Workflow Ended: done");
            }, reason => {
                if (uid) {
                    chrome.storage.sync.remove(uid, () => {
                        chrome.runtime.lastError && console.warn(chrome.runtime.lastError);
                    });
                }
                console.warn("Workflow Ended: fail");
            });
        }
    };

}
