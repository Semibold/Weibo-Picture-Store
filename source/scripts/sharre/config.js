/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @readonly
 */
export class Config {

  /**
   * @enum
   * @desc Storage Service Provider Type
   */
  static get sspType() {
    return new Set([
      "weibo.com",
      "tencent.com",
      "qiniu.com",
      "aliyun.com",
      "upyun.com",
    ]);
  }

  /**
   * @desc temp hardcode
   * @todo should return chrome.runtime.id
   */
  static get trackId() {
    return "chrome_extension";
  }

}