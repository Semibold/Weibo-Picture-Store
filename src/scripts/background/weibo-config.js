/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

class WeiboConfig {
    /**
     * @returns {string}
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
        this.customConfigKey = "custom_config";
        this.customClipsizeKey = "custom_clipsize";
        this.padding = { scheme: "2", clipsize: "1" };
        this.init();
    }

    /** @private */
    init() {
        const customConfig = {
            scheme: localStorage.getItem(`${this.customConfigKey}.scheme`),
            clipsize: localStorage.getItem(`${this.customConfigKey}.clipsize`),
        };
        const customClipsize = localStorage.getItem(this.customClipsizeKey);

        if (typeof customClipsize === "string") {
            this.external[4] = customClipsize;
        }

        if (customConfig) {
            for (const name of Object.keys(this.padding)) {
                if (typeof this.starter[name][customConfig[name]] === "string") {
                    this.padding[name] = customConfig[name];
                }
            }
        }
    }
}

export const weiboConfig = new WeiboConfig();
self.s = weiboConfig;
