/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {TencentStorageAuth} from "../../source/scripts/auth/tencent-storage.js";

/**
 * @async
 * @desc 需要测试者自己提供 key 文件
 * @example /test/key.js
 *   export const tencentAuthInfo = { accessKey: "", secretKey: "", host: ""};
 */
export async function testTencentStorageAuth() {
  const {tencentAuthInfo} = await import("../key.js");
  const {accessKey, secretKey, host} = tencentAuthInfo;
  const tsa = new TencentStorageAuth(accessKey, secretKey);
  const headers = await tsa.getAuthHeaders("GET", "/", host, "https:");
  fetch(tsa.auths.url.toString() + "&extra=A8n中文", {
    headers,
    method: tsa.auths.method,
  }).then(res => res.text()).then(t => {
    console.log(t);
    console.log("TencentStorageAuth tested.");
  });
}