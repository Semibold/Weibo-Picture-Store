/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { K_AUTO_DISPLAY_CHANGELOG, K_WEIBO_ACCOUNT_DETAILS, K_WEIBO_INHERITED_WATERMARK } from "./sharre/constant.js";
import { Utils } from "./sharre/utils.js";
import { WeiboStatic } from "./sharre/weibo-action.js";
import { ChromeStorageLocal, ChromeStorageSync } from "./sharre/chrome-storage.js";

const displayChangelog = document.querySelector<HTMLInputElement>(`input[value="auto_display_changelog"]`);
const inheritedWatermark = document.querySelector<HTMLInputElement>(`input[value="weibo_inherited_watermark"]`);
const allowUserAccount = document.querySelector<HTMLInputElement>(`input[value="allow_user_account"]`);
const httpRefererForge = document.querySelector<HTMLInputElement>(`input[value="http_referer_forge"]`);

const fieldset = document.querySelector("fieldset");
const confirm = document.querySelector<HTMLInputElement>("#confirm");
const username = document.querySelector<HTMLInputElement>("#username");
const password = document.querySelector<HTMLInputElement>("#password");

function registerInputClickEventWithSyncStorage(input: HTMLInputElement, key: string) {
    input.addEventListener("click", () => {
        const checked = input.checked;
        chrome.storage.sync.set({ [key]: checked }, () => {
            if (chrome.runtime.lastError) {
                input.checked = !checked;
            }
        });
    });
}

ChromeStorageSync.promise.then((data) => {
    displayChangelog.checked = Boolean(data[K_AUTO_DISPLAY_CHANGELOG]);
    inheritedWatermark.checked = Boolean(data[K_WEIBO_INHERITED_WATERMARK]);
});

registerInputClickEventWithSyncStorage(displayChangelog, K_AUTO_DISPLAY_CHANGELOG);
registerInputClickEventWithSyncStorage(inheritedWatermark, K_WEIBO_INHERITED_WATERMARK);

ChromeStorageLocal.promise.then((json) => {
    const data = json[K_WEIBO_ACCOUNT_DETAILS];
    username.value = data.username;
    password.value = data.password;

    if (data.allowUserAccount) {
        allowUserAccount.checked = true;
        fieldset.disabled = false;
    }
});

allowUserAccount.addEventListener("click", (e) => {
    const checked = allowUserAccount.checked;
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

confirm.addEventListener("click", () => {
    const details: WB.AccountInfo = {
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

function checkoutWeiboAccount(details: WB.AccountInfo) {
    WeiboStatic.signInByUserAccount(details.username, details.password)
        .then(() => {
            Utils.notify({ message: "配置成功，当前账号已登录" });
        })
        .catch((reason?: Error) => {
            Utils.notify({ message: `配置失败，${reason?.message || "请检查微博账户信息"}` });
        });
}

chrome.permissions.contains(
    {
        origins: ["*://*/*"],
    },
    (result) => {
        httpRefererForge.checked = result;
        httpRefererForge.disabled = result;
    },
);

httpRefererForge.addEventListener("click", () => {
    const target = httpRefererForge;
    const oldValue = !target.checked;
    chrome.permissions.request(
        {
            origins: ["*://*/*"],
        },
        (granted) => {
            if (chrome.runtime.lastError) {
                Utils.notify({ message: chrome.runtime.lastError?.message || "未知错误" });
                target.checked = oldValue;
                target.disabled = oldValue;
                return;
            }
            target.checked = granted;
            target.disabled = granted;
        },
    );
});
