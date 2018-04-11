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
 * @return {Promise<item|null>}
 */
export async function refineFile(item) {
    if (!item) {
        return null;
    }
    const x = item.data.ssp;
    if (x === "weibo_com") {
        if (!Config.weiboAcceptType[item.mimeType]) {
            chrome.notifications.create(typeId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: "暂不支持当前选中的文件格式",
            });
            return null;
        }
    }
    if (item.blob.size > Config.restricte[x].filesize) {
        chrome.notifications.create(slopId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("notify_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: "检测到某些图片的大小超过20M，自动丢弃这些图片",
        });
        return null;
    }
    return item;
}
