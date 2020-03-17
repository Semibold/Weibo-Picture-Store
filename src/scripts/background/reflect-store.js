/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { ShareStore, WeiboStore, PopupStore } from "./persist-store.js";
import {
    PConfig,
    K_WEIBO_ACCOUNT_DETAILS,
    K_POPUP_VIEWPORT_DIMENSION,
    K_AUTO_DISPLAY_CHANGELOG,
    K_WEIBO_INHERITED_WATERMARK,
} from "../sharre/constant.js";

/**
 * @param {Object} [items]
 */
function setShareStore(items) {
    if (items) {
        if (items[K_AUTO_DISPLAY_CHANGELOG] != null) {
            ShareStore.set(K_AUTO_DISPLAY_CHANGELOG, items[K_AUTO_DISPLAY_CHANGELOG]);
        }
        if (items[K_WEIBO_INHERITED_WATERMARK] != null) {
            ShareStore.set(K_WEIBO_INHERITED_WATERMARK, items[K_WEIBO_INHERITED_WATERMARK]);
        }
    }
}

/**
 * @param {Object} [details]
 */
function setWeiboStore(details) {
    if (details) {
        if (details.username != null) WeiboStore.set("username", details.username);
        if (details.password != null) WeiboStore.set("password", details.password);
        if (details.allowUserAccount != null) WeiboStore.set("allowUserAccount", details.allowUserAccount);
    }
}

/**
 * @param {Object} [details]
 */
function setPopupStore(details) {
    if (details) {
        if (Number.isSafeInteger(details.width) && Number.isSafeInteger(details.height)) {
            PopupStore.set("dimension", { width: details.width, height: details.height });
        }
    }
}

chrome.storage.sync.get(
    {
        [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
        [K_WEIBO_INHERITED_WATERMARK]: PConfig.defaultOptions.inheritWeiboWatermark,
    },
    items => {
        if (chrome.runtime.lastError) return;
        setShareStore(items);
    },
);

chrome.storage.local.get(
    {
        [K_WEIBO_ACCOUNT_DETAILS]: PConfig.defaultOptions.weiboAccountDetails,
        [K_POPUP_VIEWPORT_DIMENSION]: null,
    },
    items => {
        if (chrome.runtime.lastError) return;
        setWeiboStore(items[K_WEIBO_ACCOUNT_DETAILS]);
        setPopupStore(items[K_POPUP_VIEWPORT_DIMENSION]);
    },
);

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
        const weiboAccount = changes[K_WEIBO_ACCOUNT_DETAILS];
        const popupDimension = changes[K_POPUP_VIEWPORT_DIMENSION];
        if (weiboAccount && weiboAccount.newValue) setWeiboStore(weiboAccount.newValue);
        if (popupDimension && popupDimension.newValue) setPopupStore(popupDimension.newValue);
    }
    if (areaName === "sync") {
        const items = {};
        if (changes[K_AUTO_DISPLAY_CHANGELOG]) {
            items[K_AUTO_DISPLAY_CHANGELOG] = changes[K_AUTO_DISPLAY_CHANGELOG].newValue;
        }
        if (changes[K_WEIBO_INHERITED_WATERMARK]) {
            items[K_WEIBO_INHERITED_WATERMARK] = changes[K_WEIBO_INHERITED_WATERMARK].newValue;
        }
        setShareStore(items);
    }
});
