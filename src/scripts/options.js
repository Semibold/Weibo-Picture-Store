/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {K_PERIOD_REQUEST_LOGIN} from "./sharre/constant.js";

const requestInput = document.querySelector(`input[value="period_request_login"]`);

chrome.storage.sync.get(K_PERIOD_REQUEST_LOGIN, items => {
    if (!chrome.runtime.lastError) {
        requestInput.checked = Boolean(items[K_PERIOD_REQUEST_LOGIN]);
    }
});

requestInput.addEventListener("click", e => {
    const checked = e.target.checked;
    chrome.storage.sync.set({
        [K_PERIOD_REQUEST_LOGIN]: checked,
    }, function () {
        if (chrome.runtime.lastError) {
            requestInput.checked = !checked;
        }
    });
});
