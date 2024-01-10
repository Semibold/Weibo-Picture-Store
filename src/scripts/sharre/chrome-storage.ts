/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import {
    K_AUTO_DISPLAY_CHANGELOG,
    K_POPUP_WINDOW_INFO,
    K_RULE_ID_POINTER,
    K_WEIBO_ACCOUNT_DETAILS,
    K_WEIBO_CLIP_TYPE,
    K_WEIBO_CLIP_VALUE,
    K_WEIBO_INHERITED_WATERMARK,
    K_WEIBO_SCHEME_TYPE,
    PConfig,
} from "./constant.js";

interface IPopupWindowInfo {
    id?: number;
    locked?: boolean;
}

interface IChromeStorageLocalInfo {
    [K_WEIBO_ACCOUNT_DETAILS]?: WB.AccountInfo;
    [K_WEIBO_SCHEME_TYPE]?: string;
    [K_WEIBO_CLIP_TYPE]?: string;
    [K_WEIBO_CLIP_VALUE]?: string;
    [K_RULE_ID_POINTER]?: number;
    [K_POPUP_WINDOW_INFO]?: IPopupWindowInfo;
}

interface IChromeStorageSyncInfo {
    [K_AUTO_DISPLAY_CHANGELOG]?: boolean;
    [K_WEIBO_INHERITED_WATERMARK]?: boolean;
}

const SADCache = new Map<chrome.storage.AreaName, unknown>();

async function initializeStorageArea<T extends object>(
    areaName: chrome.storage.AreaName,
    keys?: Required<T>,
): Promise<T> {
    if (self.__isDev && SADCache.has(areaName)) {
        console.warn("Redundant initialized");
    }

    const promise = chrome.storage[areaName].get(keys) as Promise<T>;
    promise.then((data) => SADCache.set(areaName, data));
    return promise;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    const data: Record<string, unknown> = SADCache.get(areaName) || Object.create(null);

    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        data[key] = newValue;

        self.__isDev &&
            console.log(
                `Storage key "${key}" in areaName "${areaName}" changed.`,
                `Old value was "${oldValue}", new value is "${newValue}".`,
            );
    }

    SADCache.set(areaName, data);
});

class ChromeStorageArea<T extends object> {
    readonly __initPromise: Promise<T>;

    get promise(): Promise<T> {
        if (SADCache.has(this.areaName)) {
            return Promise.resolve(SADCache.get(this.areaName)) as Promise<T>;
        } else {
            return this.__initPromise;
        }
    }

    /**
     * @desc 要么提供全部的 keys 参数, 要么不提供。
     */
    constructor(
        readonly areaName: chrome.storage.AreaName,
        keys?: Required<T>,
    ) {
        this.__initPromise = initializeStorageArea<T>(this.areaName, keys);
    }

    get(): T {
        return (SADCache.get(this.areaName) || Object.create(null)) as T;
    }

    set(items: Partial<T>): Promise<void> {
        return chrome.storage[this.areaName].set(items);
    }
}

export const chromeStorageLocal = new ChromeStorageArea<IChromeStorageLocalInfo>("local", {
    [K_WEIBO_ACCOUNT_DETAILS]: PConfig.defaultOptions.weiboAccountDetails,
    [K_WEIBO_SCHEME_TYPE]: "",
    [K_WEIBO_CLIP_TYPE]: "",
    [K_WEIBO_CLIP_VALUE]: "",
    [K_RULE_ID_POINTER]: 0,
    [K_POPUP_WINDOW_INFO]: Object.create(null),
});

export const chromeStorageSync = new ChromeStorageArea<IChromeStorageSyncInfo>("sync", {
    [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
    [K_WEIBO_INHERITED_WATERMARK]: PConfig.defaultOptions.inheritWeiboWatermark,
});
