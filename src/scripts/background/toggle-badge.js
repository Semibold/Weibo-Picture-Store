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
    } else {
        chrome.browserAction.setBadgeText({tabId, text: ""});
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
    const cardChanges = changes[K_DISPLAY_USER_CARD];
    const originChanges = changes[K_REQUESR_BAN_ORIGIN];
    if (cardChanges && cardChanges.newValue != null) {
        if (cardChanges.newValue) {
            chrome.storage.local.get(K_REQUESR_BAN_ORIGIN, items => {
                midBadgeOfActiveTabs(items[K_REQUESR_BAN_ORIGIN] || {});
            });
        } else {
            chrome.tabs.query({
                active: true,
            }, tabs => {
                for (const tab of tabs) {
                    setBrowserActionBadge(tab.id, false);
                }
            });
        }
    }
    if (originChanges && originChanges.newValue != null) {
        midBadgeOfActiveTabs(originChanges.newValue);
    }
});

chrome.tabs.onCreated.addListener(tab => {
    chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
        if (!items[K_DISPLAY_USER_CARD]) return;
        chrome.tabs.query({
            active: true,
        }, tabs => {
            for (const tabInfo of tabs) {
                if (tabInfo.id === tab.id) {
                    setBrowserActionBadge(tabInfo.id, false);
                }
            }
        });
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "loading") return;
    chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
        if (!items[K_DISPLAY_USER_CARD]) return;
        chrome.tabs.query({
            active: true,
        }, tabs => {
            chrome.storage.local.get(K_REQUESR_BAN_ORIGIN, items => {
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

chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
        if (!items[K_DISPLAY_USER_CARD]) return;
        chrome.tabs.query({
            active: true,
        }, tabs => {
            chrome.storage.local.get(K_REQUESR_BAN_ORIGIN, items => {
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
