/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {gtracker} from "./g-tracker.js";

/**
 * @async
 * @param {Blob} blob
 * @param {boolean} [ext] - 是否包含文件后缀
 * @return {Promise<string>}
 */
export async function genFilename(blob, ext) {
    const start = Date.now();
    const samplesize = 512 * 1024; // 512KB
    const samplerate = 128;
    const samples = [];
    const file = new File([blob], blob.name || "", {
        type: blob.type || "",
        lastModified: blob.lastModified || Date.now(),
    });
    if (file.size > samplesize * samplerate) {
        const n = Math.floor(file.size / samplerate);
        for (let i = 0; i < samplerate; i++) {
            samples.push(file.slice(i * n, i * n + samplesize));
        }
        samples.push(file.name + file.lastModified + file.size);
        gtracker.event({
            eventCategory: "Generate Filename",
            eventAction: "Sampling",
            eventLabel: "Record filesize",
            eventValue: file.size,
            nonInteraction: true,
        });
    }
    const tfile = samples.length ? new File(samples, file.name || "", {
        type: file.type || "",
        lastModified: file.lastModified || Date.now(),
    }) : file;
    const buf = await new Promise(((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onloadend = e => {
            if (e.target.readyState === e.target.DONE) {
                resolve(e.target.result);
            } else {
                reject();
            }
        };
        fileReader.readAsArrayBuffer(tfile);
    }));
    const signBuf = await crypto.subtle.digest("sha-1", buf);
    const filename = Utils.hexitFromBuffer(signBuf);
    gtracker.timing({
        timingCategory: "Generate Filename",
        timingVar: "Computing",
        timingValue: Date.now() - start,
    });
    if (ext) {
        const rext = file.name.split(".").pop() || file.type.split("/")[1];
        const fext = rext ? `.${rext}` : "";
        return filename + fext;
    }
    return filename;
}
