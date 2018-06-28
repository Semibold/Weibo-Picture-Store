/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {
    M_VIDEO_FRAME,
    M_BATCH_DELETE,
    M_UPLOAD_IMAGE,
    M_UPLOAD_HISTORY,
} from "../sharre/constant.js";
import {fetchBlob} from "./fetch-blob.js";
import {ActionUpload} from "./action-upload.js";
import {Base64} from "../sharre/base64.js";

/**
 * @desc 上传记录的批量删除菜单
 */
chrome.contextMenus.create({
    title: "移除选中的文件",
    id: M_BATCH_DELETE,
    contexts: ["link"],
    visible: false,
    documentUrlPatterns: [
        chrome.runtime.getURL("history.html"),
        chrome.runtime.getURL("history.html?*"),
    ],
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
        case M_UPLOAD_HISTORY:
            chrome.tabs.create({url: "history.html"});
            break;
        case M_UPLOAD_IMAGE:
            fetchBlob(info.srcUrl, info.pageUrl).then(blob => {
                const actionUpload = new ActionUpload().init();
                actionUpload.addQueues([blob]);
                actionUpload.startAutoIteration();
            });
            break;
        case M_VIDEO_FRAME:
            chrome.tabs.sendMessage(tab.id, {
                type: M_VIDEO_FRAME,
                srcUrl: info.srcUrl,
            }, {frameId: info.frameId}, response => {
                if (response) {
                    const [t, b64] = response.dataurl.split(",");
                    if (b64) {
                        const buf = Base64.toBuffer(b64);
                        const file = new File([buf], `frame${response.ext}`, {
                            type: response.contentType || "",
                            lastModified: Date.now(),
                        });
                        const actionUpload = new ActionUpload().init();
                        actionUpload.addQueues([file]);
                        actionUpload.startAutoIteration();
                    }
                }
            });
            break;
    }
});
