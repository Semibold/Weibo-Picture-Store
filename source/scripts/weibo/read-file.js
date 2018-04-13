/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Channel} from "./channel.js";
import {Config} from "../sharre/config.js";
import {transformSource} from "../plugin/transform-source.js";

async function reader(blob, readType = "arrayBuffer") {
    return new Promise((resolve, reject) => {
        const oneline = Channel[readType];
        const fileReader = new FileReader();
        fileReader.onloadend = e => {
            if (e.target.readyState === e.target.DONE) {
                resolve(e.target.result);
            } else {
                resolve();
            }
        };
        fileReader[oneline.readType](blob);
    });
}

/**
 * @param item
 * @param readType
 * @return {Promise<item|void>}
 */
export async function readFile(item, readType = "arrayBuffer") {
    const oneline = Channel[readType];
    const r = await reader(item.blob, readType);
    if (!r) {
        return;
    }
    const mime = oneline.mimeType(r);
    const csts = new Set(Config.chromeSupportedTypes);
    if (csts.has(mime) && !Config.weiboAcceptType[mime]) {
        const b = await transformSource(item.blob);
        item.result = await reader(b, readType);
    } else {
        item.result = r;
    }
    item.readType = readType;
    item.mime.type = oneline.mimeType(item.result);
    item.mime.suffix = Config.weiboAcceptType[item.mime.type].typo;
    return item;
}
