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
                return Promise.reject(result);
            }
        }).then(result => {
            uid && chrome.storage.sync.set({
                [uid]: {uid: uid, albumId: result.albumId},
            }, () => chrome.runtime.lastError && console.warn(chrome.runtime.lastError));
            console.info("Workflow Ended: done");
        }, reason => {
            if (!retry && reason && reason.code === overflowCode) {
                Utils.singleton(Weibo.getAllPhoto, null, 10, 100)
                    .then(result => {
                        if (result.total + 1 > overflowNumber) {
                            return result;
                        } else {
                            Weibo.pidUpload(obj, true);
                            return Promise.reject();
                        }
                    })
                    .then(result => {
                        let photoIdArray = [];
                        for (let item of result.list) {
                            photoIdArray.push(item.photoId);
                        }
                        return [result.albumId, photoIdArray];
                    })
                    .then(result => Weibo.removePhoto(...result))
                    .then(result => Weibo.pidUpload(obj, true));
            } else {
                uid && chrome.storage.sync.remove(uid, () => {
                    chrome.runtime.lastError && console.warn(chrome.runtime.lastError);
                });
            }
            console.warn("Workflow Ended: fail");
        });
    };

}
