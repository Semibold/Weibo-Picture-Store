{

    const doneCode = 0;
    const overflowCode = 11112;
    const overflowNumber = 1000; // 相册的最大存储量
    const url = "http://photo.weibo.com/upload/photo";

    Weibo.pidUpload = (pid, uid, retry) => {
        const albumInfoPromise = Weibo.getAlbumId(uid);

        albumInfoPromise.then(albumInfo => {
            return Utils.fetch(url, {
                method: "POST",
                body: Utils.createSearchParams({
                    pid: pid,
                    isOrig: 1,
                    album_id: albumInfo.albumId,
                }),
            });
        }).then(response => {
            return response.ok ? response.json() : Promise.reject(response.status);
        }).then(json => {
            if (json && json.code === doneCode && json.result) {
                albumInfoPromise.then(albumInfo => {
                    uid && MULTIPLE_USER_CACHE.set(uid, albumInfo);
                    console.info("Workflow Ended: done");
                }).catch(reason => {
                    uid && MULTIPLE_USER_CACHE.delete(uid);
                    console.warn("Workflow Ended: fail");
                });
            } else {
                if (!retry && json && json.code === overflowCode) {
                    Weibo.getAllPhoto(null, 20, 50)
                        .then(json => Weibo.removePhoto(json.albumId, json.list.map(item => item.photoId)))
                        .then(json => Weibo.pidUpload(pid, uid, true));
                }
            }
        }).catch(Utils.noop);

    };

}
