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
 * @param {chrome.permissions.Permissions} permissions
 * @return {Promise<boolean>}
 * @no-reject
 */
async function hasOptionalPermission(permissions) {
    return new Promise((resolve, reject) => {
        chrome.permissions.contains(permissions, result => {
            resolve(result);
        });
    });
}

/**
 * @async
 * @param {string} srcUrl
 * @param {string} [pageUrl]
 * @param {boolean} [_replay = false]
 * @return {Promise<Blob>}
 * @reject {Error}
 */
export async function fetchBlob(srcUrl, pageUrl, _replay = false) {
    const progress = new FileProgress(FP_TYPE_DOWNLOAD);
    const granted = await hasOptionalPermission({ origins: ["*://*/*"] });
    const killer =
        granted &&
        !_replay &&
        Utils.isValidURL(srcUrl) &&
        Utils.isValidURL(pageUrl) &&
        HttpHeaders.rewriteRequest({ Referer: pageUrl }, { urls: [srcUrl] });

    progress.padding(1);

    return Utils.fetch(srcUrl, { credentials: "omit" })
        .then(response => response.blob())
        .then(blob => {
            progress.succeed();
            return blob;
        })
        .finally(() => {
            if (killer) {
                killer();
            }
        })
        .catch(reason => {
            const notGranted = !granted;
            const grantedAndReplayError = granted && _replay;

            if (notGranted || grantedAndReplayError) {
                progress.failure();
                chrome.notifications.create(NID_GRAB_RESOURCE, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("notify_icon"),
                    title: chrome.i18n.getMessage("warn_title"),
                    message: "无法读取远程文件，请开启选项中的伪造 HTTP Referer 功能",
                });
                Log.w({
                    module: "fetchBlob",
                    error: reason,
                    remark: `读取远程文件失败。srcUrl：${srcUrl}，pageSrc：${pageUrl || "N/A"}`,
                });
                return Promise.reject(reason);
            } else {
                /**
                 * Special Situation: The Referer(Referrer) is fantastic if website request hot-linking.
                 */
                return fetchBlob(srcUrl, pageUrl, true);
            }
        });
}
