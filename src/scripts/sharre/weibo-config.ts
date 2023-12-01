/*
 * Copyright (c) 2023 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 *
 */

import { K_WEIBO_CLIP_TYPE, K_WEIBO_CLIP_VALUE, K_WEIBO_SCHEME_TYPE } from "./constant.js";
import { chromeStorageLocal } from "./chrome-storage.js";

export type WeiboSchemeKey = "1" | "2" | "3";
export type WeiboClipKey = "1" | "2" | "3" | "4";

export interface WeiboConfigType {
    scheme: WeiboSchemeKey;
    clip: WeiboClipKey;
}

export interface WeiboConfigValue {
    scheme: string;
    clip: string;
}

/**
 * @static
 */
export class WeiboConfig {
    static readonly schemeMapping: Record<string, string> = {
        1: "http://",
        2: "https://",
        3: "//",
    };

    static readonly clipMapping: Record<string, string> = {
        1: "large",
        2: "mw690",
        3: "thumbnail",
        4: "",
    };

    static {
        chromeStorageLocal.promise.then((data) => {
            this.clipMapping[4] = data[K_WEIBO_CLIP_VALUE] || "";
        });
    }

    static async getTypeMapping(): Promise<WeiboConfigType> {
        const data = await chromeStorageLocal.promise;
        const schemeType = data[K_WEIBO_SCHEME_TYPE] as WeiboSchemeKey;
        const clipType = data[K_WEIBO_CLIP_TYPE] as WeiboClipKey;
        const config: WeiboConfigType = { scheme: "2", clip: "1" };

        switch (+schemeType) {
            case 1:
            case 2:
            case 3:
                config.scheme = schemeType;
                break;
        }

        switch (+clipType) {
            case 1:
            case 2:
            case 3:
            case 4:
                config.clip = clipType;
                break;
        }

        return config;
    }

    static async getValueMapping(): Promise<WeiboConfigValue> {
        const data = await chromeStorageLocal.promise;
        const schemeType = data[K_WEIBO_SCHEME_TYPE];
        const clipType = data[K_WEIBO_CLIP_TYPE];
        WeiboConfig.clipMapping[4] = data[K_WEIBO_CLIP_VALUE] || "";

        return {
            scheme: WeiboConfig.getSchemeFromType(schemeType),
            clip: WeiboConfig.getClipFromType(clipType),
        };
    }

    static getSchemeFromType(schemeType: string): string {
        switch (+schemeType) {
            case 1:
            case 2:
            case 3:
                return WeiboConfig.schemeMapping[schemeType];
            default:
                return WeiboConfig.schemeMapping[2];
        }
    }

    static getClipFromType(clipType: string): string {
        switch (+clipType) {
            case 1:
            case 2:
            case 3:
            case 4:
                return WeiboConfig.clipMapping[clipType];
            default:
                return WeiboConfig.clipMapping[1];
        }
    }
}
