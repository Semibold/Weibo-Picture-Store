/*
 * Copyright (c) 2020 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

self.__isDev = !chrome.runtime.getManifest().key && !chrome.runtime.getManifest().browser_specific_settings;
