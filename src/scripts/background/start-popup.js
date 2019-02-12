/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { popupMap } from "./persist-store.js";

chrome.browserAction.onClicked.addListener(tab => {
    if (!popupMap.get("locked")) {
        if (!popupMap.has("windowId")) {
            const dimension = { width: 860, height: 600, top: 0, left: 0 };
            const maximized = { state: "maximized" };
            const d = popupMap.get("dimension");
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
            popupMap.set("locked", true);
            chrome.windows.create(
                {
                    ...result,
                    focused: true,
                    incognito: false,
                    type: "popup",
                    url: "popup.html",
                },
                result => {
                    popupMap.set("windowId", result.id);
                    popupMap.set("locked", false);
                },
            );
        } else {
            chrome.windows.update(popupMap.get("windowId"), { focused: true });
        }
    }
});

chrome.windows.onRemoved.addListener(windowId => {
    windowId === popupMap.get("windowId") && popupMap.delete("windowId");
});
