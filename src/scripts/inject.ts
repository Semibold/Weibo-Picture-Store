/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

const entryPath = chrome.runtime.getURL("scripts/inject/pointer-event.js");

import(entryPath).catch((e) => {
    console.warn("[Weibo-Picture-Store]:", e);
    console.warn("[Weibo-Picture-Store]:", entryPath);
});
