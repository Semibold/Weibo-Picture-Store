/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";

const doneCode = "100000";
const url = Utils.buildURL("http://weibo.com/aj/onoff/getstatus", {sid: 0});
const notifyId = Utils.randomString(16);
const loginURL = "http://weibo.com/login.php?url=" + encodeURIComponent("http://weibo.com");

/**
 * @param isNotify
 * @return {Promise<{login: boolean}>}
 */
export async function getStatus(isNotify = false) {
    return Utils.fetch(url).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.code === doneCode) {
            return {login: true};
        } else {
            isNotify && chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("warn_title"),
                message: "当前微博处于登出状态，请登录微博后再次尝试其他操作",
                contextMessage: "单击转到微博的登录页面进行登录操作",
                requireInteraction: true,
            });
            return {login: false};
        }
    }).catch(reason => {
        isNotify && chrome.notifications.create(notifyId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: "微博登录信息校验失败，请确认微博登录后再次尝试其他操作",
            contextMessage: "单击转到微博的登录页面进行登录操作",
            requireInteraction: true,
        });
        return {login: false};
    });
}

chrome.notifications.onClicked.addListener(notificationId => {
    if (notificationId === notifyId) {
        chrome.tabs.create({url: loginURL}, tab => {
            chrome.notifications.clear(notifyId);
        });
    }
});
