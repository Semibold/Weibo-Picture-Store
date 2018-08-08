/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {K_AUTO_DISPLAY_CHANGELOG, PConfig} from "../sharre/constant.js";

/**
 * @desc changelog
 */
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: chrome.i18n.getMessage("project_readme"),
        });
    }
    if (details.reason === "update") {
        chrome.storage.sync.get({
            [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
        }, items => {
            if (chrome.runtime.lastError) return;
            if (items[K_AUTO_DISPLAY_CHANGELOG]) {
                chrome.tabs.create({
                    url: chrome.i18n.getMessage("project_changelog"),
                });
            }
        });
    }
});
