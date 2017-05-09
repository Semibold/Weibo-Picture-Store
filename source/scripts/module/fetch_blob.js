/**
 * Fetch Blob
 */
{

    const notifyId = Utils.randomString(16);

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
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("get_file_url_fail"),
            });
            return Promise.reject(reason);
        });
    };

}
