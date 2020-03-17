/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { K_WEIBO_SCHEME_TYPE, K_WEIBO_CLIPSIZE_TYPE, K_USER_CLIPSIZE_VALUE } from "../sharre/constant.js";

class WeiboConfig {
    /**
     * @return {string}
     */
    get scheme() {
        const urlScheme = this.starter.scheme[this.padding.scheme];
        if (urlScheme === this.starter.scheme[1]) return urlScheme;
        if (urlScheme === this.starter.scheme[2]) return urlScheme;
        if (self.isSecureContext) {
            return this.starter.scheme[2];
        } else {
            return this.starter.scheme[1];
        }
    }

    constructor() {
        this.starter = {
            scheme: {
                1: "http://",
                2: "https://",
                3: "//",
            },
            clipsize: {
                1: "large",
                2: "mw690",
                3: "thumbnail",
                4: "",
            },
        };
        this.external = this.starter.clipsize;
        this.padding = { scheme: "2", clipsize: "1" };
        this.init();
    }

    /** @private */
    init() {
        const config = {
            scheme: localStorage.getItem(K_WEIBO_SCHEME_TYPE),
            clipsize: localStorage.getItem(K_WEIBO_CLIPSIZE_TYPE),
        };
        const clipsize = localStorage.getItem(K_USER_CLIPSIZE_VALUE);

        if (typeof clipsize === "string") {
            this.external[4] = clipsize;
        }

        if (config) {
            for (const name of Object.keys(this.padding)) {
                if (typeof this.starter[name][config[name]] === "string") {
                    this.padding[name] = config[name];
                }
            }
        }
    }
}

export const weiboConfig = new WeiboConfig();
