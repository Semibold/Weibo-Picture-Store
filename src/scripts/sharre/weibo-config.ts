/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import { K_WEIBO_SCHEME_TYPE, K_WEIBO_CLIP_TYPE, K_WEIBO_CLIP_VALUE } from "./constant.js";

export type WeiboConfigSchemeKey = "1" | "2" | "3";
export type WeiboConfigClipKey = "1" | "2" | "3" | "4";

export interface WeiboConfigMapping {
    scheme: Record<WeiboConfigSchemeKey, string>;
    clip: Record<WeiboConfigClipKey, string>;
}

export interface WeiboConfigPadding {
    scheme: WeiboConfigSchemeKey;
    clip: WeiboConfigClipKey;
}

const starter: Readonly<WeiboConfigMapping> = {
    scheme: {
        1: "http://",
        2: "https://",
        3: "//",
    },
    clip: {
        1: "large",
        2: "mw690",
        3: "thumbnail",
        4: "",
    },
};

const padding: WeiboConfigPadding = { scheme: "2", clip: "1" };
const external = starter.clip;

/**
 * @desc NOT sync with other context
 */
chrome.storage.local.get([K_WEIBO_SCHEME_TYPE, K_WEIBO_CLIP_TYPE, K_WEIBO_CLIP_VALUE], (data) => {
    const config: WeiboConfigPadding = {
        scheme: data[K_WEIBO_SCHEME_TYPE],
        clip: data[K_WEIBO_CLIP_TYPE],
    };

    external[4] = data[K_WEIBO_CLIP_VALUE] || "";

    if (typeof starter.scheme[config.scheme] === "string") {
        padding.scheme = config.scheme;
    }
    if (typeof starter.clip[config.clip] === "string") {
        padding.clip = config.clip;
    }
});

/**
 * @desc NOT suitable for content script
 */
export const weiboConfig = {
    starter: starter,
    external: external,
    padding: padding,
    get scheme() {
        const urlScheme = starter.scheme[padding.scheme];
        if (urlScheme === starter.scheme[1]) return urlScheme;
        if (urlScheme === starter.scheme[2]) return urlScheme;
        if (self.isSecureContext) {
            return starter.scheme[2];
        } else {
            return starter.scheme[1];
        }
    },
};
