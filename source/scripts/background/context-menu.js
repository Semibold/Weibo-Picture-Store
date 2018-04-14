/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {
    BATCH_DELETE_MENU_ID,
    UPLOAD_IMAGE_MENU_ID,
    VIDEO_FRAME_MENU_ID,
    HISTORY_UPLOADED_MENU_ID,
} from "../plugin/constant.js";
import {gtracker} from "../plugin/g-tracker.js";

/**
 * @desc 上传记录的批量删除菜单
 */
chrome.contextMenus.create({
    title: "移除选中的文件",
    id: BATCH_DELETE_MENU_ID,
    contexts: ["link"],
    visible: false,
    documentUrlPatterns: [
        chrome.runtime.getURL("history.html"),
        chrome.runtime.getURL("history.html?*"),
    ],
}, () => {
    if (chrome.runtime.lastError) {
        gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
        });
    }
});


/**
 * @desc 历史记录
 */
chrome.contextMenus.create({
    title: "上传记录",
    contexts: ["browser_action"],
    id: HISTORY_UPLOADED_MENU_ID,
}, () => {
    if (chrome.runtime.lastError) {
        gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
        });
    }
});


/**
 * @desc 上传当前视频帧
 */
chrome.contextMenus.create({
    title: "把当前的视频帧上传到存储桶",
    contexts: ["video"],
    id: VIDEO_FRAME_MENU_ID,
}, () => {
    if (chrome.runtime.lastError) {
        gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
        });
    }
});


/**
 * @desc 上传图片
 */
chrome.contextMenus.create({
    title: "把这张图片上传到存储桶",
    contexts: ["image"],
    id: UPLOAD_IMAGE_MENU_ID,
}, () => {
    if (chrome.runtime.lastError) {
        gtracker.exception({
            exDescription: chrome.runtime.lastError.message,
            exFatal: true,
        });
    }
});


/**
 * @desc contextmenu events handler
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case HISTORY_UPLOADED_MENU_ID:
            chrome.tabs.create({url: "history.html"});
            break;
        case VIDEO_FRAME_MENU_ID: break;
        case UPLOAD_IMAGE_MENU_ID: break;
    }
});
