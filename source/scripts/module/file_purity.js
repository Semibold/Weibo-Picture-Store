/**
 * File Purity
 */
{

    const overflow = 20 * 1024 * 1024 - 1;
    const slopId = Utils.randomString(16);
    const typeId = Utils.randomString(16);

    Weibo.filePurity = rawData => {
        let pureData = [];

        for (let item of rawData) {
            if (!item) continue;
            if (!Weibo.acceptType[item.file.type]) {
                chrome.notifications.create(typeId, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("64"),
                    title: chrome.i18n.getMessage("info_title"),
                    message: chrome.i18n.getMessage("file_type_mismatch"),
                });
                continue;
            }
            if (item.file.size > overflow) {
                chrome.notifications.create(slopId, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("64"),
                    title: chrome.i18n.getMessage("info_title"),
                    message: chrome.i18n.getMessage("file_size_exceeded"),
                });
                continue;
            }
            pureData.push(item);
        }

        return Promise.resolve(pureData);
    };

}
