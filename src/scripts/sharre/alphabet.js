/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc Background APIs
 * @desc 用于非 Background 脚本
 */
export const backWindow = chrome.extension.getBackgroundPage();
export const coreAPIs = backWindow.coreAPIs;
