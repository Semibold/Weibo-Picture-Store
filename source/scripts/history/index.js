/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./fragment.js";
import {Dispatcher} from "./dispatcher.js";

document.title = `上传记录 - ${chrome.i18n.getMessage("extension_name")}`;
new Dispatcher().decorator();
