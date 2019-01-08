/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { weibodata } from "./persist-store.js";
import { K_WEIBO_ACCOUNT_DETAILS, PConfig } from "../sharre/constant.js";

function setWeiboDataStore(details) {
    if (details.username != null) weibodata.set("username", details.username);
    if (details.password != null) weibodata.set("password", details.password);
    if (details.allowUserAccount != null) weibodata.set("allowUserAccount", details.allowUserAccount);
}

chrome.storage.local.get(
    {
        [K_WEIBO_ACCOUNT_DETAILS]: PConfig.defaultOptions.weiboAccountDetails,
    },
    items => {
        if (chrome.runtime.lastError) return;
        setWeiboDataStore(items[K_WEIBO_ACCOUNT_DETAILS]);
    },
);

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
        const target = changes[K_WEIBO_ACCOUNT_DETAILS];
        if (target && target.newValue) setWeiboDataStore(target.newValue);
    }
});
