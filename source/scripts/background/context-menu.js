/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {BATCH_DELETE_MENU_ID} from "../plugin/constant.js";

/**
 * @desc 上传记录的批量删除菜单
 */
chrome.contextMenus.create({
    title: "删除已选中的文件",
    id: BATCH_DELETE_MENU_ID,
    contexts: ["link"],
    visible: false,
    documentUrlPatterns: [chrome.runtime.getURL("history.html")],
});
