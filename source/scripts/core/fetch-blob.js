import {TYPE_DOWNLOAD} from "../base/constant.js";
import {Utils} from "../base/utils.js";
import {fileProgress} from "./file-progress.js";

const notifyId = Utils.randomString(16);

export const fetchBlob = url => {
    const delayInfo = {
        interval: 500,
        requestId: null,
    };
    const progress = fileProgress(TYPE_DOWNLOAD);

    progress.padding(1);
    delayInfo.requestId = setTimeout(() => progress.triggerProgress(), delayInfo.interval);

    return Utils.fetch(url, {
        cache: "default",
        credentials: "omit",
    }).then(response => {
        return response.ok ? response.blob() : Promise.reject(response.status);
    }).then(result => {
        clearTimeout(delayInfo.requestId);
        progress.consume();
        return Promise.resolve(result);
    }).catch(reason => {
        clearTimeout(delayInfo.requestId);
        progress.consume();
        chrome.notifications.create(notifyId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("64"),
            title: chrome.i18n.getMessage("warn_title"),
            message: chrome.i18n.getMessage("fetch_file_failed"),
        });
        return Promise.reject(reason);
    });
};
Utils.sharre(fetchBlob);
