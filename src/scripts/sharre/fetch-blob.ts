/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "./utils.js";
import { FP_TYPE_DOWNLOAD } from "./constant.js";
import { Isomorphic } from "./isomorphic.js";
import { FileProgress } from "./file-progress.js";

/**
 * @no-reject
 */
async function hasOptionalPermission(permissions: chrome.permissions.Permissions): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        chrome.permissions.contains(permissions, (result) => resolve(result));
    });
}

/**
 * @async
 * @desc NOT suitable for content script
 * @reject {Error}
 */
export async function fetchBlob(srcUrl: string, pageUrl?: string, _replay = false): Promise<Blob> {
    const granted = await hasOptionalPermission({ origins: ["*://*/*"] });
    const ruleId = await Isomorphic.getGlobalUniqueId();
    const progress = new FileProgress(FP_TYPE_DOWNLOAD);

    progress.padding(1);

    if (granted && !_replay && Utils.isValidURL(srcUrl) && Utils.isValidURL(pageUrl)) {
        const DNR_MODIFY_HEADERS = "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS;
        const DNR_SET = "set" as chrome.declarativeNetRequest.HeaderOperation.SET;
        const hostname = new URL(location.href).hostname;
        await chrome.declarativeNetRequest.updateSessionRules({
            addRules: [
                {
                    id: ruleId,
                    action: {
                        type: DNR_MODIFY_HEADERS,
                        requestHeaders: [
                            {
                                operation: DNR_SET,
                                header: "Referer",
                                value: pageUrl,
                            },
                        ],
                    },
                    condition: {
                        initiatorDomains: [hostname],
                        urlFilter: srcUrl,
                    },
                },
            ],
            removeRuleIds: [ruleId],
        });
    }

    return Utils.fetch(srcUrl, { credentials: "omit" })
        .then((response) => response.blob())
        .then((blob) => {
            progress.succeed();
            return blob;
        })
        .finally(() => {
            if (ruleId) {
                chrome.declarativeNetRequest.updateSessionRules({
                    removeRuleIds: [ruleId],
                });
            }
        })
        .catch((reason) => {
            const notGranted = !granted;
            const grantedAndReplayError = granted && _replay;

            if (notGranted || grantedAndReplayError) {
                progress.failure();
                Utils.notify({
                    title: chrome.i18n.getMessage("warn_title"),
                    message: "无法读取远程文件，请开启选项中的伪造 HTTP Referer 功能",
                });
                Utils.log.w({
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
