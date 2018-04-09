/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

const popupState = new Map();

chrome.browserAction.onClicked.addListener(tab => {
  if (!popupState.get("locked")) {
    if (!popupState.has("id")) {
      const width = 860;
      const height = 600;
      const top = Math.floor(screen.availHeight / 2 - height / 2);
      const left = Math.floor(screen.availWidth / 2 - width / 2);

      popupState.set("locked", true);
      chrome.windows.create({
        top,
        left,
        width,
        height,
        focused: true,
        incognito: false,
        type: "popup",
        url: "popup.html",
      }, result => {
        popupState.set("id", result.id);
        popupState.set("locked", false);
      });
    } else {
      chrome.windows.update(popupState.get("id"), {focused: true});
    }
  }
});


chrome.windows.onRemoved.addListener(windowId => {
  windowId === popupState.get("id") && popupState.delete("id");
});
