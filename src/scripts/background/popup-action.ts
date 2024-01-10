/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { chromeStorageLocal } from "../sharre/chrome-storage.js";
import { K_POPUP_WINDOW_INFO } from "../sharre/constant.js";

chrome.action.onClicked.addListener(async () => {
    const data = await chromeStorageLocal.promise;
    const popupWindowInfo = data[K_POPUP_WINDOW_INFO];

    const createPopupWindow = () => {
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
                        chromeStorageLocal.set({ [K_POPUP_WINDOW_INFO]: popupWindowInfo });
                    },
                );
            } else {
                chrome.tabs.update(popupWindowInfo.id, { active: true }).catch(() => {
                    popupWindowInfo.id = null;
                    popupWindowInfo.locked = false;
                    createPopupWindow();
                });
            }
        }
    };

    createPopupWindow();
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const data = await chromeStorageLocal.promise;
    const popupWindowInfo = data[K_POPUP_WINDOW_INFO];

    if (popupWindowInfo.id && popupWindowInfo.id === tabId) {
        popupWindowInfo.id = null;
        popupWindowInfo.locked = false;
        chromeStorageLocal.set({ [K_POPUP_WINDOW_INFO]: popupWindowInfo });
    }
});
