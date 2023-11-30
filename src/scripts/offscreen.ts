/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import { Utils } from "./sharre/utils.js";
import { K_OFFSCREEN_QUERY_NAME } from "./sharre/constant.js";

const searchParams = new URLSearchParams(location.search);
const srcUrl = decodeURIComponent(searchParams.get(K_OFFSCREEN_QUERY_NAME) || "");

async function waitUrlLoadEnded(srcUrl: string): Promise<void> {
    const iframe = document.createElement("iframe");
    const promise = new Promise<void>((resolve) => {
        // Useless
        iframe.onerror = () => resolve();
        iframe.onload = () => resolve();
    });

    iframe.src = srcUrl;
    document.body.append(iframe);
    return promise;
}

async function removeOffscreenWindow(): Promise<void> {
    return new Promise(async (resolve) => {
        await Utils.sleep(10);
        chrome.windows.getCurrent((window) => chrome.windows.remove(window.id, resolve));
    });
}

if (srcUrl) {
    waitUrlLoadEnded(srcUrl).finally(removeOffscreenWindow);
} else {
    removeOffscreenWindow();
}
