import {Utils} from "../base/utils.js";
import {acceptType, maximumFileSize} from "../base/register.js";

const slopId = Utils.randomString(16);
const typeId = Utils.randomString(16);

export const filePurity = list => {
    const congruent = [];
    const judge = {
        typeMismatch: false,
        sizeOverflow: false,
    };

    for (const item of list) {
        if (!item) continue;
        if (!acceptType[item.mimeType]) {
            judge.typeMismatch = true;
            continue;
        }
        if (item.blob.size > maximumFileSize) {
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
Utils.sharre(filePurity);
