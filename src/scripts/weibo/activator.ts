/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import { Utils } from "../sharre/utils.js";
import { K_OFFSCREEN_QUERY_NAME } from "../sharre/constant.js";
import { Deferred } from "../sharre/deferred.js";

interface IOffscreenWindowInfo {
    windowId: number;
    lastDeferred: Deferred<void>;
    lastCreated: number;
}

const iframeId = `iframe-${Utils.randomString(6)}`;
const minCreateOffscreenInterval = 3600 * 1000;
const offscreenWindowInfo: Partial<IOffscreenWindowInfo> = {
    windowId: null,
    lastDeferred: null,
    lastCreated: null,
};

async function tryActivateUserStatusInDocument(srcUrl: string): Promise<void> {
    const iframe = document.querySelector<HTMLIFrameElement>(`#${iframeId}`) || document.createElement("iframe");
    const promise = new Promise<void>((resolve, reject) => {
        // Useless
        iframe.onerror = () => {
            reject();
            iframe.onload = null;
            iframe.onerror = null;
            iframe.remove();
        };
        iframe.onload = () => {
            resolve();
            iframe.onload = null;
            iframe.onerror = null;
            iframe.remove();
        };
    });
    iframe.hidden = true;
    iframe.id = iframeId;
    iframe.src = srcUrl;
    document.body.append(iframe);
    return promise;
}

/**
 * @desc Singleton
 * @desc 无法处理中途更换账号的情况
 */
async function tryActivateUserStatusInServiceWorker(srcUrl: string): Promise<void> {
    if (offscreenWindowInfo.lastDeferred) {
        return offscreenWindowInfo.lastDeferred.promise;
    }
    if (offscreenWindowInfo.lastCreated && Date.now() - offscreenWindowInfo.lastCreated < minCreateOffscreenInterval) {
        return;
    }

    const deferred = new Deferred<void>();

    chrome.windows
        .create({
            focused: false,
            state: "minimized",
            url: `offscreen.html?${K_OFFSCREEN_QUERY_NAME}=${encodeURIComponent(srcUrl)}`,
        })
        .then((window) => {
            if (window) {
                offscreenWindowInfo.windowId = window.id;
                offscreenWindowInfo.lastCreated = Date.now();
            } else {
                deferred.reject(new Error("window is falsely"));
            }
        })
        .catch(deferred.reject);

    offscreenWindowInfo.lastDeferred = deferred;
    deferred.promise.finally(() => {
        offscreenWindowInfo.lastDeferred = null;
    });
    return deferred.promise;
}

chrome.windows.onRemoved.addListener((windowId) => {
    if (offscreenWindowInfo.windowId && offscreenWindowInfo.windowId === windowId) {
        offscreenWindowInfo.windowId = null;
        if (offscreenWindowInfo.lastDeferred) {
            offscreenWindowInfo.lastDeferred.resolve();
        }
    }
});

export async function tryActivateUserStatus(srcUrl: string): Promise<void> {
    Utils.log.d({
        module: "tryActivateUserStatus",
        remark: `${Utils.isBackground}`,
    });
    if (Utils.isBackground) {
        return tryActivateUserStatusInServiceWorker(srcUrl);
    } else {
        return tryActivateUserStatusInDocument(srcUrl);
    }
}
