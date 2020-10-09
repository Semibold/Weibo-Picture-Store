/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { K_AUTO_DISPLAY_CHANGELOG, K_WEIBO_ACCOUNT_DETAILS, K_WEIBO_INHERITED_WATERMARK } from "./sharre/constant.js";
import { coreAPIs } from "./sharre/alphabet.js";

const displayChangelog = document.querySelector(`input[value="auto_display_changelog"]`);
const inheritedWatermark = document.querySelector(`input[value="weibo_inherited_watermark"]`);
const allowUserAccount = document.querySelector(`input[value="allow_user_account"]`);
const httpRefererForge = document.querySelector(`input[value="http_referer_forge"]`);

const fieldset = document.querySelector("fieldset");
const confirm = document.getElementById("confirm");
const username = document.getElementById("username");
const password = document.getElementById("password");

function registerInputClickEventWithSyncStorage(input, key) {
    input.addEventListener("click", e => {
        const checked = e.target.checked;
        chrome.storage.sync.set({ [key]: checked }, function() {
            if (chrome.runtime.lastError) {
                input.checked = !checked;
            }
        });
    });
}

displayChangelog.checked = Boolean(coreAPIs.ShareStore.get(K_AUTO_DISPLAY_CHANGELOG));
inheritedWatermark.checked = Boolean(coreAPIs.ShareStore.get(K_WEIBO_INHERITED_WATERMARK));

registerInputClickEventWithSyncStorage(displayChangelog, K_AUTO_DISPLAY_CHANGELOG);
registerInputClickEventWithSyncStorage(inheritedWatermark, K_WEIBO_INHERITED_WATERMARK);

username.value = coreAPIs.WeiboStore.get("username");
password.value = coreAPIs.WeiboStore.get("password");

if (coreAPIs.WeiboStore.get("allowUserAccount")) {
    allowUserAccount.checked = true;
    fieldset.disabled = false;
}

allowUserAccount.addEventListener("click", e => {
    const checked = e.target.checked;
    chrome.storage.local.set(
        {
            [K_WEIBO_ACCOUNT_DETAILS]: {
                username: username.value,
                password: password.value,
                allowUserAccount: checked,
            },
        },
        () => {
            if (chrome.runtime.lastError) {
                allowUserAccount.checked = !checked;
                return;
            }
            fieldset.disabled = !checked;
        },
    );
});

confirm.addEventListener("click", e => {
    const details = {
        username: username.value,
        password: password.value,
        allowUserAccount: allowUserAccount.checked,
    };
    chrome.storage.local.set(
        {
            [K_WEIBO_ACCOUNT_DETAILS]: details,
        },
        () => {
            if (chrome.runtime.lastError) return;
            checkoutWeiboAccount(details);
        },
    );
});

function checkoutWeiboAccount(details) {
    coreAPIs.WeiboStatic.signInByUserAccount(details.username, details.password)
        .then(() => {
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: "配置成功，当前账号已登录",
            });
        })
        .catch(reason => {
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: `配置失败，${(reason && reason.message) || "请检查微博账户信息"}`,
            });
        });
}

chrome.permissions.contains(
    {
        origins: ["*://*/*"],
    },
    result => {
        httpRefererForge.checked = result;
        httpRefererForge.disabled = result;
    },
);

httpRefererForge.addEventListener("click", e => {
    const oldValue = !e.target.checked;
    chrome.permissions.request(
        {
            origins: ["*://*/*"],
        },
        granted => {
            if (chrome.runtime.lastError) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("notify_icon"),
                    title: chrome.i18n.getMessage("warn_title"),
                    message: chrome.runtime.lastError || "未知错误",
                });
                e.target.checked = oldValue;
                e.target.disabled = oldValue;
                return;
            }
            e.target.checked = granted;
            e.target.disabled = granted;
        },
    );
});
