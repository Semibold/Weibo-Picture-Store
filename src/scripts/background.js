/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 仅需要引入让其执行
 */
import "./background/start-popup.js";
import "./background/weibo-referer.js";
import "./background/context-menu.js";
import "./background/events-hander.js"

/**
 * @desc 不需要初始化，但是需要导出到外部
 */
import {fetchBlob} from "./background/fetch-blob.js";
import {ActionUpload} from "./background/action-upload.js";
import {ActionHistory} from "./background/action-history.js";
import {ActionDelete} from "./background/action-delete.js";

/**
 * @desc Core Share Module (APIs)
 */
self.coreAPIs = {
    fetchBlob,
    ActionUpload,
    ActionHistory,
    ActionDelete,
};
