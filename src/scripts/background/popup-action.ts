/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

interface IPopupWindowInfo {
    id: number;
    locked: boolean;
}

const popupWindowInfo: IPopupWindowInfo = { id: null, locked: false };

chrome.action.onClicked.addListener(() => {
    if (!popupWindowInfo.locked) {
        if (!popupWindowInfo.id) {
            popupWindowInfo.locked = true;
            chrome.tabs.create(
                {
                    active: true,
                    url: "popup.html",
                },
                (tab) => {
                    popupWindowInfo.id = tab.id;
                    popupWindowInfo.locked = false;
                },
            );
        } else {
            chrome.tabs.update(popupWindowInfo.id, { active: true });
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (popupWindowInfo.id && popupWindowInfo.id === tabId) {
        popupWindowInfo.id = null;
    }
});
