/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {
    M_UPLOAD_FRAME,
    M_BATCH_DELETE,
    M_UPLOAD_IMAGE,
    M_OPEN_HISTORY,
    M_DOWNLOAD_LOG,
    ET_UPLOAD_MUTATION,
} from "../sharre/constant.js";
import { Utils } from "../sharre/utils.js";
import { Base64 } from "../sharre/base64.js";
import { PConfig } from "../sharre/constant.js";
import { WeiboUpload } from "./weibo-action.js";
import { fetchBlob } from "./fetch-blob.js";
import { Log } from "../sharre/log.js";

const weiboUpload = new WeiboUpload();

weiboUpload.addEventListener(ET_UPLOAD_MUTATION, e => {
    chrome.browserAction.setBadgeBackgroundColor({ color: "#8E7467" }, () => {
        chrome.browserAction.setBadgeText({ text: String(e.detail.size || "") });
    });
});

/**
 * @param {{done: boolean, value: PackedItem}} it
 */
function autoCopyUrlToClipboard(it) {
    if (it && !it.done && it.value) {
        const item = it.value;
        const suffix = PConfig.weiboSupportedTypes[item.mimeType].typo;
        const url = `https://${PConfig.randomImageHost}/large/${item.pid + suffix}`;
        const result = Utils.writeToClipboard(url);
        if (result) {
            chrome.notifications.create("copy_url_to_clipboard", {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: "复制成功：链接已经复制到剪切板了呦~",
            });
        }
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
    id: M_OPEN_HISTORY,
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
    id: M_UPLOAD_FRAME,
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
            Log.download();
            break;
        case M_OPEN_HISTORY:
            chrome.tabs.create({ url: "history.html" });
            break;
        case M_UPLOAD_IMAGE:
            fetchBlob(info.srcUrl, info.pageUrl).then(blob => {
                weiboUpload.addQueues([blob]);
                weiboUpload.triggerIteration(autoCopyUrlToClipboard);
            });
            break;
        case M_UPLOAD_FRAME:
            chrome.tabs.sendMessage(
                tab.id,
                { type: M_UPLOAD_FRAME, srcUrl: info.srcUrl },
                { frameId: info.frameId },
                response => {
                    /**
                     * @var {{dataurl: string}} response
                     */
                    if (response) {
                        const [t, b64] = response.dataurl.split(",");
                        if (b64) {
                            const blob = new Blob([Base64.toBuffer(b64)]);
                            weiboUpload.addQueues([blob]);
                            weiboUpload.triggerIteration(autoCopyUrlToClipboard);
                        }
                    }
                },
            );
            break;
    }
});
