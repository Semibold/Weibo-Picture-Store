/*
 * Copyright (c) 2020 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @typedef {boolean} DEBUG
 */
self.DEBUG = !chrome.runtime.getManifest().key || !chrome.runtime.getManifest().browser_specific_settings;
