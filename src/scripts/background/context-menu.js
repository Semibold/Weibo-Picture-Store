/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { M_VIDEO_FRAME, M_BATCH_DELETE, M_UPLOAD_IMAGE, M_UPLOAD_HISTORY, M_DOWNLOAD_LOG } from "../sharre/constant.js";
import { Utils } from "../sharre/utils.js";
import { Base64 } from "../sharre/base64.js";
import { PConfig } from "../sharre/constant.js";
import { WeiboUpload } from "./weibo-action.js";
import { fetchBlob } from "./fetch-blob.js";
import { logger } from "./internal-logger.js";

const copyToClipboardId = Utils.randomString(16);

/**
 * @param {PackedItem} item
 */
function writeToClipboard(item) {
    const suffix = PConfig.weiboSupportedTypes[item.mimeType].typo;
    const url = `https://${PConfig.randomImageHost}/large/${item.pid + suffix}`;
    const result = Utils.writeToClipboard(url);
    if (result) {
        chrome.notifications.create(copyToClipboardId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: "复制成功：链接已经复制到剪切板了呦~",
        });
    }
}

/**
 * @desc 上传记录的批量删除菜单
 */
chrome.contextMenus.create({
    title: "移除选中的文件",
    id: M_BATCH_DELETE,
    contexts: ["link"],
    visible: false,
    documentUrlPatterns: [chrome.runtime.getURL("history.html"), chrome.runtime.getURL("history.html?*")],
});

/**
 * @desc 历史记录
 */
chrome.contextMenus.create({
    title: "上传记录",
    contexts: ["browser_action"],
    id: M_UPLOAD_HISTORY,
});

/**
 * @desc 导出日志
 */
chrome.contextMenus.create({
    title: "导出日志",
    contexts: ["browser_action"],
    id: M_DOWNLOAD_LOG,
});

/**
 * @desc 上传当前视频帧
 */
chrome.contextMenus.create({
    title: "把当前的视频帧上传到微相册",
    contexts: ["video"],
    id: M_VIDEO_FRAME,
});

/**
 * @desc 上传图片
 */
chrome.contextMenus.create({
    title: "把这张图片上传到微相册",
    contexts: ["image"],
    id: M_UPLOAD_IMAGE,
});

/**
 * @desc contextmenu events handler
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case M_DOWNLOAD_LOG:
            logger.download();
            break;
        case M_UPLOAD_HISTORY:
            chrome.tabs.create({ url: "history.html" });
            break;
        case M_UPLOAD_IMAGE:
            fetchBlob(info.srcUrl, info.pageUrl).then(blob => {
                const weiboUpload = new WeiboUpload();
                weiboUpload.addQueues([blob]);
                weiboUpload.triggerIteration(it => {
                    if (!it.done && it.value) {
                        writeToClipboard(it.value);
                    }
                });
            });
            break;
        case M_VIDEO_FRAME:
            chrome.tabs.sendMessage(
                tab.id,
                {
                    type: M_VIDEO_FRAME,
                    srcUrl: info.srcUrl,
                },
                { frameId: info.frameId },
                response => {
                    /**
                     * @desc `response` 的数据结构: {dataurl: string}
                     */
                    if (response) {
                        const [t, b64] = response.dataurl.split(",");
                        if (b64) {
                            const blob = new Blob([Base64.toBuffer(b64)]);
                            const weiboUpload = new WeiboUpload();
                            weiboUpload.addQueues([blob]);
                            weiboUpload.triggerIteration(it => {
                                if (!it.done && it.value) {
                                    writeToClipboard(it.value);
                                }
                            });
                        }
                    }
                },
            );
            break;
    }
});
