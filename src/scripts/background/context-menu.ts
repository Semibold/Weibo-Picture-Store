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
    NID_COPY_URL_FAIL,
} from "../sharre/constant.js";
import { Utils } from "../sharre/utils.js";
import { Base64 } from "../sharre/base64.js";
import { PConfig } from "../sharre/constant.js";
import { WeiboUpload } from "../sharre/weibo-action.js";
import { fetchBlob } from "../sharre/fetch-blob.js";
import { Log } from "./log.js";
import { WeiboConfig } from "../sharre/weibo-config.js";

const contentScriptUploader = new WeiboUpload();

contentScriptUploader.addQueueMutationCallback((size) => {
    chrome.action.setBadgeBackgroundColor({ color: "#8E7467" }, () => {
        chrome.action.setBadgeText({ text: String(size || "") });
    });
});

chrome.runtime.onInstalled.addListener(() => {
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
        contexts: ["action"],
        id: M_OPEN_HISTORY,
    });

    /**
     * @desc 导出日志
     */
    chrome.contextMenus.create({
        title: "导出日志",
        contexts: ["action"],
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
});

/**
 * @desc contextmenu events handler
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    /**
     * @param {{done: boolean, value: PackedItem|null}} [it]
     */
    const autoCopyUrlToClipboard = async (it?: IteratorResult<WB.PackedItem>) => {
        if (it && !it.done && it.value) {
            const item = it.value;
            const suffix = PConfig.weiboSupportedTypes[item.mimeType].typo;
            const { scheme, clip } = await WeiboConfig.getValueMapping();
            const url = Utils.genExternalUrl(scheme, clip, item.pid, suffix);

            chrome.tabs.sendMessage<RSS.WriteToClipboard, RSS.WriteToClipboardRes>(
                tab.id,
                {
                    cmd: "WriteToClipboard",
                    content: url,
                },
                {
                    frameId: info.frameId,
                },
                (response) => {
                    if (response && response.valid && !response.done) {
                        Utils.notify(NID_COPY_URL_FAIL, { message: "操作失败：链接没有复制到剪切板中(lll￢ω￢)" });
                    }
                },
            );
        }
    };

    switch (info.menuItemId) {
        case M_DOWNLOAD_LOG:
            Log.download();
            break;
        case M_OPEN_HISTORY:
            chrome.tabs.create({ url: "history.html" });
            break;
        case M_UPLOAD_IMAGE:
            fetchBlob(info.srcUrl, info.frameUrl || info.pageUrl).then((blob) => {
                contentScriptUploader.addQueues([blob]);
                contentScriptUploader.triggerIteration(autoCopyUrlToClipboard);
            });
            break;
        case M_UPLOAD_FRAME:
            chrome.tabs.sendMessage<RSS.UploadVideoFrame, RSS.UploadFrameRes>(
                tab.id,
                { cmd: "UploadVideoFrame", srcUrl: info.srcUrl, info: info },
                { frameId: info.frameId },
                (response) => {
                    if (response) {
                        const [t, b64] = response.dataURL.split(",");
                        if (b64) {
                            const blob = new Blob([Base64.toBuffer(b64)]);
                            contentScriptUploader.addQueues([blob]);
                            contentScriptUploader.triggerIteration(autoCopyUrlToClipboard);
                        }
                    }
                },
            );
            break;
    }
});
