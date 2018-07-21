/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {K_PERIOD_REQUEST_LOGIN, K_DISPLAY_USER_CARD} from "./sharre/constant.js";

const displayUserCard = document.querySelector(`input[value="display_user_card"]`);
const periodRequestLogin = document.querySelector(`input[value="period_request_login"]`);

chrome.storage.sync.get([K_PERIOD_REQUEST_LOGIN, K_DISPLAY_USER_CARD], items => {
    if (!chrome.runtime.lastError) {
        displayUserCard.checked = Boolean(items[K_DISPLAY_USER_CARD]);
        periodRequestLogin.checked = Boolean(items[K_PERIOD_REQUEST_LOGIN]);
    }
});

displayUserCard.addEventListener("click", e => {
    const checked = e.target.checked;
    chrome.storage.sync.set({
        [K_DISPLAY_USER_CARD]: checked,
    }, function () {
        if (chrome.runtime.lastError) {
            displayUserCard.checked = !checked;
        }
    });
});

periodRequestLogin.addEventListener("click", e => {
    const checked = e.target.checked;
    chrome.storage.sync.set({
        [K_PERIOD_REQUEST_LOGIN]: checked,
    }, function () {
        if (chrome.runtime.lastError) {
            periodRequestLogin.checked = !checked;
        }
    });
});
