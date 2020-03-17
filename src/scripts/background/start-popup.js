/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { PopupStore } from "./persist-store.js";

chrome.browserAction.onClicked.addListener(tab => {
    if (!PopupStore.get("locked")) {
        if (!PopupStore.has("windowId")) {
            const dimension = { width: 860, height: 600, top: 0, left: 0 };
            const maximized = { state: "maximized" };
            const d = PopupStore.get("dimension");

            if (d) {
                if (d.width >= 300 && d.width <= screen.availWidth) dimension.width = d.width;
                if (d.height >= 150 && d.height <= screen.availHeight) dimension.height = d.height;
            }

            // screenTop and screenLeft are always 0 in background page,
            // top and left does not accurate if user have more than one display.
            dimension.top = self.screenTop + Math.floor(screen.availHeight / 2 - dimension.height / 2);
            dimension.left = self.screenLeft + Math.floor(screen.availWidth / 2 - dimension.width / 2);
            const result =
                d && d.width === screen.availWidth && d.height === screen.availHeight ? maximized : dimension;

            PopupStore.set("locked", true);
            chrome.windows.create(
                {
                    ...result,
                    incognito: false,
                    type: "popup",
                    url: "popup.html",
                },
                result => {
                    PopupStore.set("windowId", result.id);
                    PopupStore.set("locked", false);
                },
            );
        } else {
            chrome.windows.update(PopupStore.get("windowId"), { focused: true });
        }
    }
});

chrome.windows.onRemoved.addListener(windowId => {
    windowId === PopupStore.get("windowId") && PopupStore.delete("windowId");
});
