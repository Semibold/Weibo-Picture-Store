/**
 * Fetch Blob
 */
{

    Weibo.fetchBlob = url => {
        let fileProgress = Weibo.fileProgress(Weibo.fileProgress.TYPE_DOWNLOAD);

        fileProgress.addNextWave(1);
        fileProgress.triggerProgress();

        return Utils.fetch(url, {
            credentials: "omit",
        }).then(response => {
            return response.ok ? response.blob() : Promise.reject();
        }).then(result => {
            fileProgress.accumulator();
            return Promise.resolve(result);
        }).catch(reason => {
            fileProgress.accumulator();
            return Promise.reject(reason);
        });
    };

}
