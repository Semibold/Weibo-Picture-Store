/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 仅需要引入让其执行
 */
import "./background/start-popup.js";
import "./background/menu-selector.js";
import "./background/weibo-referer.js";

/**
 * @desc 不需要初始化，但是需要导出到外部
 */
import {fetchBlob} from "./background/fetch-blob.js";
import {syncedSData} from "./background/synced-sdata.js";
import {ActionProxy} from "./background/action-proxy.js";
import {ActionUpload} from "./background/action-upload.js";

/**
 * @desc 其他
 */
import {gtracker} from "./plugin/g-tracker.js";

gtracker.pageview();

/**
 * @desc Core Share Module (APIs)
 */
self.coreAPIs = {
    fetchBlob,
    syncedSData,
    ActionProxy,
    ActionUpload,
};