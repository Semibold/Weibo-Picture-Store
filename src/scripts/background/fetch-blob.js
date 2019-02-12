/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { FileProgress } from "./file-progress.js";
import { FP_TYPE_DOWNLOAD, NID_GRAB_RESOURCE } from "../sharre/constant.js";
import { Log } from "../sharre/log.js";
import { HttpHeaders } from "./http-headers.js";

/**
 * @async
 * @param {string} srcUrl
 * @param {string} [pageUrl]
 * @return {Promise<Blob>}
 * @reject {Error}
 */
export async function fetchBlob(srcUrl, pageUrl) {
    const progress = new FileProgress(FP_TYPE_DOWNLOAD);
    const killer =
        Utils.isValidURL(srcUrl) &&
        Utils.isValidURL(pageUrl) &&
        HttpHeaders.rewriteRequest({ Referer: pageUrl }, { urls: [srcUrl] });

    progress.padding(1);

    Log.d({
        module: "FetchBlob",
        message: "开始读取远程文件",
        remark: "大部分情况下都是从缓存中直接读取，因此不再提供下载进度提示",
    });

    return Utils.fetch(srcUrl, { credentials: "omit" })
        .then(response => response.blob())
        .then(blob => {
            progress.succeed();
            return blob;
        })
        .catch(reason => {
            progress.failure();
            chrome.notifications.create(NID_GRAB_RESOURCE, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("warn_title"),
                message: "无法读取远程文件",
            });
            Log.w({
                module: "FetchBlob",
                message: reason,
                remark: `读取远程文件失败。srcUrl：${srcUrl}，pageSrc：${pageUrl || "N/A"}`,
            });
            return Promise.reject(reason);
        })
        .finally(() => {
            if (killer) {
                killer();
            }
        });
}
