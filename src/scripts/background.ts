/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 仅需要引入让其执行
 */
import "./env.js";
import "./background/context-menu.js";
import "./background/events-handler.js";
import "./background/popup-action.js";
import "./background/start-changelog.js";
import "./background/weibo-referer.js";

import { Log } from "./background/log.js";
import { Utils } from "./sharre/utils.js";
import { GUID } from "./background/guid.js";
import { NID_MISMATCH_CORS } from "./sharre/constant.js";

chrome.runtime.onMessage.addListener((message: ServiceWorkerMessage, sender, sendResponse) => {
    if (!message) return;

    switch (message.cmd) {
        case "GetRuleId": {
            GUID.generate().then(sendResponse);
            return true;
        }
        case "AddLog": {
            Log.add(message.data, message.type);
            break;
        }
        case "WithoutCorsMode": {
            Utils.notify(NID_MISMATCH_CORS, {
                title: chrome.i18n.getMessage("warn_title"),
                message: "当前资源的网络请求不符合 CORS 规范，无法读取资源的数据",
            });
            break;
        }
    }
});
