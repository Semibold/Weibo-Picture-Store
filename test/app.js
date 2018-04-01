/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import "./scripts/hash-hmac.js";
import "./scripts/base64.js";
import "./scripts/md5.js";

import {testTencentStorageAuth} from "./scripts/tencent-storage.js";

/**
 * @desc manual testing function
 */
self._Manual_Testing_ = async function () {
  testTencentStorageAuth().catch(r => console.warn(r));
};