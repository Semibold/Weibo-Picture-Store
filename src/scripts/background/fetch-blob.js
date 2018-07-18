/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {FileProgress} from "./file-progress.js";
import {FP_TYPE_DOWNLOAD} from "../sharre/constant.js";

const fetchFailedId = Utils.randomString(16);

/**
 * @async
 * @param {string} srcUrl
 * @param {string} [pageUrl]
 * @return {Promise<Blob, Error>}
 */
export async function fetchBlob(srcUrl, pageUrl) {
    const delayInfo = {interval: 500, timerId: null};
    const progress = new FileProgress(FP_TYPE_DOWNLOAD);

    progress.padding(1);
    delayInfo.timerId = setTimeout(() => progress.trigger(), delayInfo.interval);

    function beforeSendHeaders(details) {
        const name = "referer";
        const value = pageUrl;
        for (let i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name.toLowerCase() === name) {
                details.requestHeaders.splice(i, 1);
                break;
            }
        }
        details.requestHeaders.push({name, value});
        return {requestHeaders: details.requestHeaders};
    }

    if (Utils.isValidURL(srcUrl) && Utils.isValidURL(pageUrl)) {
        chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, {
            urls: [srcUrl],
        }, ["requestHeaders", "blocking"]);
    }

    return Utils
        .fetch(srcUrl, {credentials: "omit"})
        .then(response => response.ok ? response.blob() : Promise.reject(new Error(response.statusText)))
        .then(result => {
            clearTimeout(delayInfo.timerId);
            progress.consume();
            return Promise.resolve(result);
        })
        .catch(reason => {
            clearTimeout(delayInfo.timerId);
            progress.consume();
            chrome.notifications.create(fetchFailedId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("warn_title"),
                message: "无法读取远程文件",
            });
            return Promise.reject(reason);
        })
        .finally(() => {
            if (chrome.webRequest.onBeforeSendHeaders.hasListener(beforeSendHeaders)) {
                chrome.webRequest.onBeforeSendHeaders.removeListener(beforeSendHeaders);
            }
        });
}