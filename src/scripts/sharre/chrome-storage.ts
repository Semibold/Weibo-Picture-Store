/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import {
    K_AUTO_DISPLAY_CHANGELOG,
    K_WEIBO_ACCOUNT_DETAILS,
    K_WEIBO_CLIP_TYPE,
    K_WEIBO_CLIP_VALUE,
    K_WEIBO_INHERITED_WATERMARK,
    K_WEIBO_SCHEME_TYPE,
    PConfig,
} from "./constant.js";

interface IChromeStorageLocalInfo {
    [K_WEIBO_ACCOUNT_DETAILS]?: WB.AccountInfo;
    [K_WEIBO_SCHEME_TYPE]?: string;
    [K_WEIBO_CLIP_TYPE]?: string;
    [K_WEIBO_CLIP_VALUE]?: string;
}

interface IChromeStorageSyncInfo {
    [K_AUTO_DISPLAY_CHANGELOG]?: boolean;
    [K_WEIBO_INHERITED_WATERMARK]?: boolean;
}

const SADCache = new Map<chrome.storage.AreaName, unknown>();

async function initializeStorageArea<T extends object>(areaName: chrome.storage.AreaName, keys?: unknown): Promise<T> {
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

/**
 * @static
 */
export class ChromeStorageLocal {
    static __initPromise: Promise<IChromeStorageLocalInfo>;
    static {
        this.__initPromise = initializeStorageArea("local", {
            [K_WEIBO_ACCOUNT_DETAILS]: PConfig.defaultOptions.weiboAccountDetails,
        });
    }

    static get promise(): Promise<IChromeStorageLocalInfo> {
        if (SADCache.has("local")) {
            return Promise.resolve(SADCache.get("local"));
        } else {
            return this.__initPromise;
        }
    }

    static get info(): IChromeStorageLocalInfo {
        return SADCache.get("local");
    }
}

/**
 * @static
 */
export class ChromeStorageSync {
    static __initPromise: Promise<IChromeStorageSyncInfo>;
    static {
        this.__initPromise = initializeStorageArea("sync", {
            [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
            [K_WEIBO_INHERITED_WATERMARK]: PConfig.defaultOptions.inheritWeiboWatermark,
        });
    }

    static get promise(): Promise<IChromeStorageSyncInfo> {
        if (SADCache.has("sync")) {
            return Promise.resolve(SADCache.get("sync"));
        } else {
            return this.__initPromise;
        }
    }

    static get info(): IChromeStorageSyncInfo {
        return SADCache.get("sync");
    }
}
