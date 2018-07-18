/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./popup/fragment.js";
import {PConfig} from "./sharre/constant.js";
import {Dispatcher} from "./popup/dispatcher.js";
import {backWindow} from "./sharre/alphabet.js";

document.title = chrome.i18n.getMessage("ext_name");

const dispatcher = new Dispatcher().init();
const fileInput = document.querySelector("#file-input");
const browsingHistory = document.querySelector(".head-browsing-history");

fileInput.accept = PConfig.chromeSupportedTypes.join(",");
fileInput.addEventListener("change", e => {
    dispatcher.requester(e.target.files);
});

browsingHistory.addEventListener("click", e => {
    backWindow.chrome.tabs.create({url: "history.html"});
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
    dispatcher.requester(e.dataTransfer.files);
});