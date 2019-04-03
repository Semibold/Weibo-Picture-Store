/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./popup/fragment.js";
import { ET_UPLOAD_MUTATION, K_POPUP_VIEWPORT_DIMENSION, PConfig } from "./sharre/constant.js";
import { Dispatcher } from "./popup/dispatcher.js";
import { backWindow } from "./sharre/alphabet.js";
import { fetchDirectory, hasDirectoryUpload } from "./sharre/fetch-directory.js";

document.title = chrome.i18n.getMessage("ext_name");

const dispatcher = new Dispatcher().init();
const fileInput = document.querySelector("#file-input");
const browsingHistory = document.querySelector(".head-browsing-history");

dispatcher.weiboUpload.addEventListener(ET_UPLOAD_MUTATION, e => {
    const size = e.detail.size;
    const originTitle = chrome.i18n.getMessage("ext_name");
    if (size) {
        document.title = `${originTitle} - 加速上传中...剩余 ${size} 个文件`;
    } else {
        document.title = originTitle;
    }
});

fileInput.accept = PConfig.chromeSupportedTypes.join(",");
fileInput.addEventListener("change", e => {
    dispatcher.requester(e.target.files);
});

browsingHistory.addEventListener("click", e => {
    backWindow.chrome.tabs.create({ url: "history.html" });
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        chrome.tabs.getCurrent(tab => {
            chrome.tabs.remove(tab.id);
        });
    }
});

document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
    e.preventDefault();
    if (hasDirectoryUpload()) {
        fetchDirectory(e.dataTransfer.items).then(revFiles => {
            const filesFromFile = [];
            const filesFromDirectory = {};
            for (const revFile of revFiles) {
                if (revFile.fromFile) {
                    filesFromFile.push(revFile.file);
                }
                if (revFile.fromDirectory) {
                    if (revFile.fullDirectoryPath) {
                        if (!filesFromDirectory[revFile.fullDirectoryPath]) {
                            filesFromDirectory[revFile.fullDirectoryPath] = [];
                        }
                        filesFromDirectory[revFile.fullDirectoryPath].push(revFile.file);
                    } else {
                        filesFromFile.push(revFile.file);
                    }
                }
            }
            Object.keys(filesFromDirectory).forEach(fullDirectoryPath => {
                dispatcher.requester(filesFromDirectory[fullDirectoryPath], fullDirectoryPath);
            });
            dispatcher.requester(filesFromFile);
        });
    } else {
        dispatcher.requester(e.dataTransfer.files);
    }
});

self.addEventListener("resize", function handler(e) {
    clearTimeout(handler.timerId);
    handler.timerId = setTimeout(() => {
        chrome.storage.local.set({
            [K_POPUP_VIEWPORT_DIMENSION]: { width: self.outerWidth, height: self.outerHeight },
        });
    }, 300);
});
