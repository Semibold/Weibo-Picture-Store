/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {FileProgress, FP_ACTION_DOWNLOAD} from "./file-progress.js";

const failedId = Utils.randomString(16);

/**
 * @async
 * @param {string} url
 * @return {Promise<Response>}
 */
export async function fetchBlob(url) {
    const delayInfo = {interval: 500, requestId: null};
    const progress = new FileProgress(FP_ACTION_DOWNLOAD);

    progress.padding(1);
    delayInfo.requestId = setTimeout(() => progress.trigger(), delayInfo.interval);

    return Utils.fetch(url, {
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
        chrome.notifications.create(failedId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: "无法读取远程文件",
        });
        return Promise.reject(reason);
    });
}