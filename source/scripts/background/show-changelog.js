/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

chrome.runtime.onInstalled.addListener(details => {
    if (details.previousVersion) {
        const [major, minor, patch] = details.previousVersion.split(".");
        if (details.reason === "update" || details.reason === "install") {
            major < 4 && chrome.tabs.create({url: "recorder.html#changelog"});
        }
    }
});
