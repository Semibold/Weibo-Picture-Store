{

    const overflow = 20 * 1024 * 1024 - 1;
    const slopId = Utils.randomString(16);
    const typeId = Utils.randomString(16);

    Weibo.filePurity = list => {
        const congruent = [];
        const judge = {
            typeMismatch: false,
            sizeOverflow: false,
        };

        for (const item of list) {
            if (!item) continue;
            if (!Weibo.acceptType[item.mimeType]) {
                judge.typeMismatch = true;
                continue;
            }
            if (item.blob.size > overflow) {
                judge.sizeOverflow = true;
                continue;
            }
            congruent.push(item);
        }

        judge.typeMismatch && chrome.notifications.create(typeId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("64"),
            title: chrome.i18n.getMessage("info_title"),
            message: chrome.i18n.getMessage("file_type_mismatch"),
        });

        judge.sizeOverflow && chrome.notifications.create(slopId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("64"),
            title: chrome.i18n.getMessage("info_title"),
            message: chrome.i18n.getMessage("file_size_overflow"),
        });

        return Promise.resolve(congruent);
    };

}
