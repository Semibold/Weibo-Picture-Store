/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {Config} from "./config.js";

const slopId = Utils.randomString(16);
const typeId = Utils.randomString(16);

/**
 * @async
 * @param item
 * @return {Promise<item|void>}
 */
export async function filePurity(item) {
    if (!item) {
        return;
    }
    const x = item.data.ssp;
    if (x === "weibo_com") {
        if (!Config.weiboAcceptType[item.mime.type]) {
            chrome.notifications.create(typeId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: "暂不支持当前选中的文件格式",
            });
            return;
        }
    }
    if (item.blob.size > Config.restricte[x].filesize) {
        chrome.notifications.create(slopId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: `检测到某些文件的大小超过${Config.restricte[x].sizename}，自动丢弃这些文件`,
        });
        return;
    }
    return item;
}
