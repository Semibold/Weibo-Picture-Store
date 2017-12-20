/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

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
        iconUrl: chrome.i18n.getMessage("notification_icon"),
        title: chrome.i18n.getMessage("info_title"),
        message: chrome.i18n.getMessage("file_type_mismatch"),
    });

    judge.sizeOverflow && chrome.notifications.create(slopId, {
        type: "basic",
        iconUrl: chrome.i18n.getMessage("notification_icon"),
        title: chrome.i18n.getMessage("info_title"),
        message: chrome.i18n.getMessage("file_size_overflow"),
    });

    return Promise.resolve(congruent);
};
Utils.sharre(filePurity);
