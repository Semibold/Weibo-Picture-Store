/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { HttpHeaders } from "./http-headers.js";

HttpHeaders.rewriteRequest(
    {
        Referer: "http://photo.weibo.com/",
        Origin: "http://photo.weibo.com",
    },
    {
        urls: ["http://photo.weibo.com/*"],
        types: ["xmlhttprequest"],
    },
);

HttpHeaders.rewriteRequest(
    {
        Referer: "https://photo.weibo.com/",
        Origin: "https://photo.weibo.com",
    },
    {
        urls: ["https://photo.weibo.com/*"],
        types: ["xmlhttprequest"],
    },
);
