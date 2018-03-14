/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../base/utils.js";

const doneCode = "100000";
const url = Utils.buildURL("http://weibo.com/aj/onoff/getstatus", {sid: 0});

export const loginStatusId = Utils.randomString(16);
export const getStatus = (isNotification = false) => {
    return Utils.fetch(url).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        /**
         * @TODO (?)检验登录 URL 及检查登录时产生重定向次数（并非很好的方案）
         * @WARN 此处无法检测微博账号异常，若用户账号异常，静默失败
         */
        if (json && json.code === doneCode) {
            return {login: true};
        } else {
            isNotification && chrome.notifications.create(loginStatusId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notification_icon"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("being_logout_status"),
                contextMessage: chrome.i18n.getMessage("goto_login_page_hinter"),
                isClickable: true,
                requireInteraction: true,
            });
            return {login: false};
        }
    }).catch(reason => {
        isNotification && chrome.notifications.create(loginStatusId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notification_icon"),
            title: chrome.i18n.getMessage("warn_title"),
            message: chrome.i18n.getMessage("check_logging_status"),
            contextMessage: chrome.i18n.getMessage("goto_login_page_hinter"),
            isClickable: true,
            requireInteraction: true,
        });
        return {login: false};
    });
};

/**
 * @desc Inject function exported into coreAPIs
 * @desc These code must be invoked with chrome extension's background page context
 */
Utils.injectIntoCoreAPI(getStatus);
