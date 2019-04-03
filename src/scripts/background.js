/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 仅需要引入让其执行
 */
import "./background/start-popup.js";
import "./background/start-changelog.js";
import "./background/weibo-referer.js";
import "./background/context-menu.js";
import "./background/file-progress.js";
import "./background/events-handler.js";
import "./background/reflect-store.js";

/**
 * @desc 不需要初始化，但是需要导出到外部
 */
import { logSet, genericMap, weiboMap } from "./background/persist-store.js";
import { fetchBlob } from "./background/fetch-blob.js";
import { WeiboStatic, WeiboUpload } from "./background/weibo-action.js";

/**
 * @desc Core Share Module (APIs)
 */
self.coreAPIs = { logSet, genericMap, weiboMap, fetchBlob, WeiboStatic, WeiboUpload };
