{

    const notifyId = Utils.randomString(16);

    Weibo.fetchBlob = url => {
        const delayInfo = {
            interval: 500,
            requestId: null,
        };
        const fileProgress = Weibo.fileProgress(Weibo.fileProgress.TYPE_DOWNLOAD);

        fileProgress.padding(1);
        delayInfo.requestId = setTimeout(() => fileProgress.triggerProgress(), delayInfo.interval);

        return Utils.fetch(url, {
            cache: "default",
            credentials: "omit",
        }).then(response => {
            return response.ok ? response.blob() : Promise.reject(response.status);
        }).then(result => {
            clearTimeout(delayInfo.requestId);
            fileProgress.consume();
            return Promise.resolve(result);
        }).catch(reason => {
            clearTimeout(delayInfo.requestId);
            fileProgress.consume();
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("fetch_file_failed"),
            });
            return Promise.reject(reason);
        });
    };

}
