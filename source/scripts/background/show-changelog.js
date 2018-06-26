/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

chrome.runtime.onInstalled.addListener(details => {
    chrome.tabs.create({url: "recorder.html#changelog"});
});
