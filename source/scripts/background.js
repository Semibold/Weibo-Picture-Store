/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @include "./core/*.js"
 * Must be initialized on background page.
 */
import "./core/check-album-id.js";
import "./core/fetch-blob.js";
import "./core/file-progress.js";
import "./core/file-purity.js";
import "./core/file-upload.js";
import "./core/get-album-id.js";
import "./core/get-all-photo.js";
import "./core/get-status.js";
import "./core/pid-upload.js";
import "./core/remove-photo.js";
import "./core/set-status.js";

import {Utils} from "./base/utils.js";
import {
    transferType,
    loginWeiboURL,
    acceptType,
} from "./base/register.js";
import {loginStatusId} from "./core/get-status.js";
import {filePurity} from "./core/file-purity.js";
import {fileUpload} from "./core/file-upload.js";


const notifyId = Utils.randomString(16);
const popupState = new Map();


/**
 * 通知的点击事件
 */
chrome.notifications.onClicked.addListener(notificationId => {
    if (notificationId === loginStatusId) {
        chrome.tabs.create({url: loginWeiboURL}, tab => chrome.notifications.clear(loginStatusId));
    }
});


chrome.browserAction.onClicked.addListener(tab => {
    if (!popupState.get("locked")) {
        if (!popupState.has("id")) {
            const width = 860;
            const height = 600;
            const top = Math.floor(screen.availHeight / 2 - height / 2);
            const left = Math.floor(screen.availWidth / 2 - width / 2);

            popupState.set("locked", true);
            chrome.windows.create({
                top,
                left,
                width,
                height,
                focused: true,
                incognito: false,
                type: "popup",
                url: "popup.html",
            }, result => {
                popupState.set("id", result.id);
                popupState.set("locked", false);
            });
        } else {
            chrome.windows.update(popupState.get("id"), {drawAttention: true});
        }
    }
});


chrome.windows.onRemoved.addListener(windowId => {
    windowId === popupState.get("id") && popupState.delete("id");
});


/**
 * 右键菜单：历史记录
 */
chrome.contextMenus.create({
    title: chrome.i18n.getMessage("manage_history_record"),
    contexts: ["browser_action"],
    onclick: (obj, tab) => {
        chrome.tabs.create({url: "history.html"});
    },
});


/**
 * 右键菜单：上传当前视频帧
 */
chrome.contextMenus.create({
    title: chrome.i18n.getMessage("upload_frame_to_micro_album"),
    contexts: ["video"],
    onclick: (obj, tab) => {
        chrome.tabs.sendMessage(tab.id, {
            type: transferType.fromVideoFrame,
            srcUrl: obj.srcUrl,
        }, {frameId: obj.frameId});
    },
});


/**
 * 右键菜单：上传图片
 */
chrome.contextMenus.create({
    title: chrome.i18n.getMessage("upload_image_to_micro_album"),
    contexts: ["image"],
    onclick: (obj, tab) => {
        chrome.tabs.sendMessage(tab.id, {
            type: transferType.fromImageFrame,
            srcUrl: obj.srcUrl,
        }, {frameId: obj.frameId});
    },
});


chrome.runtime.onInstalled.addListener(details => {
    if (details.previousVersion) {
        const [major, minor, patch] = details.previousVersion.split(".");
        if (details.reason === "update" && major < 3) {
            chrome.tabs.create({url: "recorder.html#changelog"});
        }
    }
});


chrome.runtime.onMessage.addListener((message, sender) => {
    if (message && message.type === transferType.fromBase64) {
        filePurity(message.result)
            .then(result => fileUpload(result))
            .then(result => {
                const buffer = [];
                for (const item of result) {
                    const url = `${message.prefix + item.pid + acceptType[item.mimeType].typo + message.suffix}`;
                    buffer.push(url);
                }
                if (message.item.writeln === "clipboard") {
                    const text = buffer.join("\n");
                    Utils.writeToClipboard(text, () => {
                        text && chrome.notifications.create(notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notification_icon"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("write_to_clipboard"),
                            contextMessage: chrome.i18n.getMessage("write_to_clipboard_hinter"),
                        });
                    });
                }
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: transferType.fromBackground,
                    item: message.item,
                    buffer: buffer,
                    result: result,
                    prefix: message.prefix,
                    suffix: message.suffix,
                }, {frameId: sender.frameId});
            });
    }
    if (message && message.type === transferType.fromWithoutCORSMode) {
        chrome.notifications.create(notifyId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notification_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: chrome.i18n.getMessage("resource_without_cors_mode"),
        });
    }
    if (message && message.type === transferType.fromFetchFileFailed) {
        chrome.notifications.create(notifyId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notification_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: chrome.i18n.getMessage("fetch_file_failed"),
        });
    }
});


chrome.commands.onCommand.addListener(command => {
    switch (command) {
        case "transform-pointer-events":
            chrome.tabs.query({
                active: true,
            }, tabs => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: transferType.fromChromeCommand,
                        command: command,
                    });
                }
            });
            break;
    }
});


/**
 * 注册创建微博相册所需的 Referer
 * @todo Pending: Use https if Weibo force https protocol(?)
 */
chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    const name = "Referer";
    const value = "http://photo.weibo.com/";

    for (let i = 0; i < details.requestHeaders.length; i++) {
        if (details.requestHeaders[i].name.toLowerCase() === name.toLowerCase()) {
            details.requestHeaders.splice(i, 1);
            break;
        }
    }

    details.requestHeaders.push({name, value});
    return {requestHeaders: details.requestHeaders};
}, {
    urls: ["http://photo.weibo.com/*"],
}, ["requestHeaders", "blocking"]);
