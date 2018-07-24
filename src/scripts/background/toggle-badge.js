/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {K_DISPLAY_USER_CARD, K_REQUESR_BAN_ORIGIN} from "../sharre/constant.js";

/**
 * @param {number} tabId
 * @param {boolean} banned
 */
function setBrowserActionBadge(tabId, banned) {
    if (banned) {
        chrome.browserAction.setBadgeText({tabId, text: "D"});
        chrome.browserAction.setBadgeBackgroundColor({tabId, color: [100, 100, 100, 1]});
        chrome.browserAction.setTitle({tabId, title: `${chrome.runtime.getManifest().name}\n当前域名下的微博信息卡：禁用`});
    } else {
        chrome.browserAction.setBadgeText({tabId, text: ""});
        chrome.browserAction.setTitle({tabId, title: chrome.runtime.getManifest().name});
    }
}

/**
 * @param {Object} [bannedOrigins]
 */
function midBadgeOfActiveTabs(bannedOrigins) {
    chrome.tabs.query({
        active: true,
    }, tabs => {
        for (const tab of tabs) {
            const banned = Boolean(bannedOrigins[Utils.getOriginFromUrl(tab.url)]);
            setBrowserActionBadge(tab.id, banned);
        }
    });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    const targetChanges = changes[K_DISPLAY_USER_CARD];
    if (targetChanges && targetChanges.newValue != null) {
        if (targetChanges.newValue) {
            chrome.storage.local.get(K_REQUESR_BAN_ORIGIN, items => {
                if (chrome.runtime.lastError) return;
                midBadgeOfActiveTabs(items[K_REQUESR_BAN_ORIGIN] || {});
            });
        } else {
            chrome.tabs.query({}, tabs => {
                for (const tab of tabs) {
                    if (tab.id > chrome.tabs.TAB_ID_NONE) {
                        setBrowserActionBadge(tab.id, false);
                    }
                }
            });
        }
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    const targetChanges = changes[K_REQUESR_BAN_ORIGIN];
    if (targetChanges && targetChanges.newValue != null) {
        midBadgeOfActiveTabs(targetChanges.newValue);
    }
});

/**
 * @desc 新建标签页
 * @desc 暂时用不到
 */
// chrome.tabs.onCreated.addListener(tab => {
//     chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
//         if (chrome.runtime.lastError) return;
//         if (!items[K_DISPLAY_USER_CARD]) return;
//         chrome.tabs.query({
//             active: true,
//         }, tabs => {
//             for (const tabInfo of tabs) {
//                 if (tabInfo.id === tab.id) {
//                     setBrowserActionBadge(tabInfo.id, false);
//                 }
//             }
//         });
//     });
// });

/**
 * @desc 标签页刷新和载入
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "loading") return;
    chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
        if (chrome.runtime.lastError) return;
        if (!items[K_DISPLAY_USER_CARD]) return;
        chrome.tabs.query({
            active: true,
        }, tabs => {
            chrome.storage.local.get(K_REQUESR_BAN_ORIGIN, items => {
                if (chrome.runtime.lastError) return;
                for (const tabInfo of tabs) {
                    if (tabInfo.id === tabId) {
                        if (items[K_REQUESR_BAN_ORIGIN] &&
                            items[K_REQUESR_BAN_ORIGIN][Utils.getOriginFromUrl(tab.url)]) {
                            setBrowserActionBadge(tabInfo.id, true);
                        } else {
                            setBrowserActionBadge(tabInfo.id, false);
                        }
                    }
                }
            });
        });
    });
});

/**
 * @desc 跨标签状态同步
 */
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
        if (chrome.runtime.lastError) return;
        if (!items[K_DISPLAY_USER_CARD]) return;
        chrome.tabs.query({
            active: true,
        }, tabs => {
            chrome.storage.local.get(K_REQUESR_BAN_ORIGIN, items => {
                if (chrome.runtime.lastError) return;
                for (const tab of tabs) {
                    if (tab.id === activeInfo.tabId) {
                        if (items[K_REQUESR_BAN_ORIGIN] &&
                            items[K_REQUESR_BAN_ORIGIN][Utils.getOriginFromUrl(tab.url)]) {
                            setBrowserActionBadge(tab.id, true);
                        } else {
                            setBrowserActionBadge(tab.id, false);
                        }
                    }
                }
            });
        });
    });
});
