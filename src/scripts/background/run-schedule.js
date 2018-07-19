/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {WeiboStatic} from "./weibo-action.js";
import {K_PERIOD_REQUEST_LOGIN} from "../sharre/constant.js";

chrome.storage.sync.get(K_PERIOD_REQUEST_LOGIN, items => {
    if (!chrome.runtime.lastError) {
        if (items[K_PERIOD_REQUEST_LOGIN]) {
            WeiboStatic.startSchedule();
        }
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    const targetChanges = changes[K_PERIOD_REQUEST_LOGIN];
    if (targetChanges && targetChanges.newValue != null) {
        if (targetChanges.newValue) {
            WeiboStatic.startSchedule();
        } else {
            WeiboStatic.closeSchedule();
        }
    }
});
