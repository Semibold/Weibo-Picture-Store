/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

const urls = ["http://photo.weibo.com/*", "https://photo.weibo.com/*"];

/**
 * @desc 处理相关的 Referer
 * @return {{requestHeaders: chrome.webRequest.HttpHeader[]}}
 */
function beforeSendHeaders(details) {
    const url = new URL(details.url);
    const name = "referer";
    const value = `${url.protocol}//photo.weibo.com/`;
    for (let i = 0; i < details.requestHeaders.length; i++) {
        if (details.requestHeaders[i].name.toLowerCase() === name) {
            details.requestHeaders.splice(i, 1);
            break;
        }
    }
    details.requestHeaders.push({name, value});
    return {requestHeaders: details.requestHeaders};
}

chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, {
    urls,
    types: ["xmlhttprequest"],
}, ["requestHeaders", "blocking"]);
