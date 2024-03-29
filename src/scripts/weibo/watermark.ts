/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { E_INVALID_PARSED_DATA } from "../sharre/constant.js";

/**
 * @export
 * @no-reject
 */
export async function requestWeiboWatermark(isInherited = false): Promise<WB.Watermark | null> {
    if (!isInherited) {
        return null;
    }

    return Utils.fetch(Utils.buildURL("https://photo.weibo.com/users/get_watermark", { __rnd: Date.now() }))
        .then((response) => response.json())
        .then((json) => {
            if (json && json["code"] === 0 && json["result"]) {
                const watermark: Record<string, unknown> = {};
                const propMapping: Record<string, string> = {
                    nickname: "nick",
                    domain: "url",
                    logo: "logo",
                    position: "markpos",
                };
                Object.keys(json["data"]).forEach((name) => {
                    if (propMapping.hasOwnProperty(name)) {
                        watermark[propMapping[name]] = json["data"][name];
                    }
                });
                return watermark;
            } else {
                throw new Error(E_INVALID_PARSED_DATA);
            }
        })
        .catch((reason) => {
            Utils.log.w({
                module: "requestWeiboWatermark",
                error: reason,
            });
            return null;
        });
}
