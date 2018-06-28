/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Channel} from "./channel.js";
import {Config} from "../sharre/constant.js";
import {remuxImage} from "../sharre/remux-image.js";

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
 * @param {Blob|File} blob
 * @param {string} [readType="arrayBuffer"]
 * @return {Promise<Object|void>}
 */
export async function readFile(blob, readType = "arrayBuffer") {
    const data = {
        blob: blob,
        result: null,
        readType: null,
        mimeType: null,
    };
    const oneline = Channel[readType];
    const r = await reader(blob, readType);
    if (!r) {
        return;
    }
    const mime = oneline.mimeType(r);
    const chromeSupportedTypes = new Set(Config.chromeSupportedTypes);
    if (chromeSupportedTypes.has(mime) && !Config.weiboSupportedTypes[mime]) {
        const b = await remuxImage(blob);
        data.result = await reader(b, readType);
    } else {
        data.result = r;
    }
    data.readType = readType;
    data.mimeType = oneline.mimeType(data.result);
    return data;
}
