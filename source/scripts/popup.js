/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./popup/fragment.js";
import {Dispatcher} from "./popup/dispatcher.js";

document.title = chrome.i18n.getMessage("ext_name");

const dispatcher = new Dispatcher().init();