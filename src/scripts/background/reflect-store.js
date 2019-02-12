/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { weiboMap, popupMap } from "./persist-store.js";
import { K_WEIBO_ACCOUNT_DETAILS, PConfig, K_POPUP_VIEWPORT_DIMENSION } from "../sharre/constant.js";

function setWeiboMapStore(details) {
    if (details.username != null) weiboMap.set("username", details.username);
    if (details.password != null) weiboMap.set("password", details.password);
    if (details.allowUserAccount != null) weiboMap.set("allowUserAccount", details.allowUserAccount);
}

function setPopupMapStore(details) {
    if (details) {
        if (Number.isSafeInteger(details.width) && Number.isSafeInteger(details.height)) {
            popupMap.set("dimension", { width: details.width, height: details.height });
        }
    }
}

chrome.storage.local.get(
    {
        [K_WEIBO_ACCOUNT_DETAILS]: PConfig.defaultOptions.weiboAccountDetails,
        [K_POPUP_VIEWPORT_DIMENSION]: null,
    },
    items => {
        if (chrome.runtime.lastError) return;
        setWeiboMapStore(items[K_WEIBO_ACCOUNT_DETAILS]);
        setPopupMapStore(items[K_POPUP_VIEWPORT_DIMENSION]);
    },
);

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
        const weiboAccount = changes[K_WEIBO_ACCOUNT_DETAILS];
        const popupDimension = changes[K_POPUP_VIEWPORT_DIMENSION];
        if (weiboAccount && weiboAccount.newValue) setWeiboMapStore(weiboAccount.newValue);
        if (popupDimension && popupDimension.newValue) setPopupMapStore(popupDimension.newValue);
    }
});
