/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./history/fragment.js";
import { Dispatcher } from "./history/dispatcher.js";
import { M_BATCH_DELETE } from "./sharre/constant.js";

document.title = `上传记录 - ${chrome.i18n.getMessage("ext_name")}`;
const dispatcher = new Dispatcher().init();

document.addEventListener(
    "contextmenu",
    e => {
        const section = e.target.closest("section");
        if (section) {
            chrome.contextMenus.update(M_BATCH_DELETE, {
                visible: dispatcher.selected.has(section),
            });
        }
    },
    true,
);

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === M_BATCH_DELETE) {
        chrome.tabs.getCurrent(currentTab => {
            if (tab.id === currentTab.id) {
                dispatcher.detachSelectedPhoto();
            }
        });
    }
});
