/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./history/fragment.js";
import {Dispatcher} from "./history/dispatcher.js";

import {gtracker} from "./plugin/g-tracker.js";

gtracker.pageview();

document.title = `上传记录 - ${chrome.i18n.getMessage("ext_name")}`;
new Dispatcher().init();
