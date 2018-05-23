/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {QCloudStorageAuth} from "../../source/scripts/auth/qcloud-storage.js";

/**
 * @async
 * @desc 需要手动运行测试
 * @desc 需要测试者自己提供 key 文件
 * @example ../key.template.js
 */
export async function qcloudStorageAuthTester() {
    const {qcloudAuthInfo} = await import("../key.js");
    const {accessKey, secretKey, host} = qcloudAuthInfo;
    const qsa = new QCloudStorageAuth(accessKey, secretKey);
    const headers = await qsa.getAuthHeaders("GET", "/", host, "https:");
    fetch(qsa.auths.url.toString() + "&extra=A8n中文", {
        headers,
        method: qsa.auths.method,
    }).then(res => res.text()).then(t => {
        console.log(t);
        console.log("QCloudStorageAuth tested.");
    });
}