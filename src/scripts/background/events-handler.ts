/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { NID_REMAIN_LOGOUT } from "../sharre/constant.js";

chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === NID_REMAIN_LOGOUT) {
        const url = `https://weibo.com/login.php?url=${encodeURIComponent("https://weibo.com")}`;
        chrome.tabs.create({ url }, (tab) => chrome.notifications.clear(NID_REMAIN_LOGOUT));
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "execute_pointer_events") {
        chrome.tabs.query(
            {
                active: true,
                currentWindow: true,
            },
            (tabs) => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage<RSS.AllowPointerEvents>(tab.id, {
                        cmd: "AllowPointerEvents",
                        command: command,
                    });
                }
            },
        );
    }
});
