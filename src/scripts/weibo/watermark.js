/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { E_INVALID_PARSED_DATA } from "../sharre/constant.js";
import { Log } from "../sharre/log.js";

/**
 * @export
 * @typedef {Object} Watermark
 * @property {string} nick
 * @property {string} url
 * @property {string|number} logo
 * @property {string|number} markpos
 *
 * @param {boolean} [isInherited = false]
 * @return {Promise<Watermark|null>}
 * @no-reject
 */
export async function requestWeiboWatermark(isInherited = false) {
    if (!isInherited) {
        return null;
    }

    return Utils.fetch(Utils.buildURL("http://photo.weibo.com/users/get_watermark", { __rnd: Date.now() }))
        .then(response => response.json())
        .then(json => {
            if (json && json["code"] === 0 && json["result"]) {
                const watermark = {};
                const propMapping = { nickname: "nick", domain: "url", logo: "logo", position: "markpos" };
                Object.keys(json["data"]).forEach(name => {
                    if (propMapping.hasOwnProperty(name)) {
                        watermark[propMapping[name]] = json["data"][name];
                    }
                });
                return watermark;
            } else {
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch(reason => {
            Log.w({
                module: "requestWeiboWatermark",
                message: reason,
            });
            return null;
        });
}
