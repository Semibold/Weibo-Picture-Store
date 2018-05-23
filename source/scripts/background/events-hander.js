/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {S_WITHOUT_CORS_MODE, S_COMMAND_POINTER_EVENTS} from "../sharre/constant.js";

const failedId = Utils.randomString(16);

chrome.commands.onCommand.addListener(command => {
    switch (command) {
        case "transform-pointer-events":
            chrome.tabs.query({
                active: true,
            }, tabs => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: S_COMMAND_POINTER_EVENTS,
                        command: command,
                    });
                }
            });
            break;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === S_WITHOUT_CORS_MODE) {
        chrome.notifications.create(failedId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: "当前资源的网络请求不符合 CORS 规范，无法读取资源的数据",
        });
    }
});
