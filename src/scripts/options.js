/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { K_AUTO_DISPLAY_CHANGELOG, K_WEIBO_ACCOUNT_DETAILS, PConfig } from "./sharre/constant.js";
import { SharreM } from "./sharre/alphabet.js";

const displayChangelog = document.querySelector(`input[value="auto_display_changelog"]`);

chrome.storage.sync.get(
    {
        [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
    },
    items => {
        if (chrome.runtime.lastError) return;
        displayChangelog.checked = Boolean(items[K_AUTO_DISPLAY_CHANGELOG]);
    },
);

displayChangelog.addEventListener("click", e => {
    const checked = e.target.checked;
    chrome.storage.sync.set(
        {
            [K_AUTO_DISPLAY_CHANGELOG]: checked,
        },
        function() {
            if (chrome.runtime.lastError) {
                displayChangelog.checked = !checked;
            }
        },
    );
});

const allowUserAccount = document.querySelector(`input[value="allow_user_account"]`);
const fieldset = document.querySelector("fieldset");
const confirm = document.getElementById("confirm");
const username = document.getElementById("username");
const password = document.getElementById("password");

username.value = SharreM.weiboMap.get("username");
password.value = SharreM.weiboMap.get("password");

if (SharreM.weiboMap.get("allowUserAccount")) {
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
    SharreM.WeiboStatic.signInByUserAccount(details.username, details.password)
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
                message: "配置失败，请检查账号和密码是否正确",
                contextMessage: (reason && reason.message) || "未知错误",
            });
        });
}
