/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {
    S_WITHOUT_CORS_MODE,
    S_REQUEST_USER_CARD,
    S_COMMAND_POINTER_EVENTS,
} from "../sharre/constant.js";
import {WeiboStatic} from "./weibo-action.js";

const mismatchSpecId = Utils.randomString(16);

chrome.commands.onCommand.addListener(command => {
    switch (command) {
        case "pointer-events-of-current-tab":
            chrome.tabs.query({
                active: true,
                currentWindow: true,
            }, tabs => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: S_COMMAND_POINTER_EVENTS,
                        command: command,
                    });
                }
            });
            break;
        case "weibo-card-of-current-tab":
            break;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === S_WITHOUT_CORS_MODE) {
        chrome.notifications.create(mismatchSpecId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: "当前资源的网络请求不符合 CORS 规范，无法读取资源的数据",
        });
    }
    if (message.type === S_REQUEST_USER_CARD) {
        WeiboStatic
            .getUserCard(message.url)
            .then(json => sendResponse(json))
            .catch(reason => sendResponse(null));
        return true;
    }
});
