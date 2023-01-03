/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 涉及微博的相关域名
 *  weibo.com
 *  photo.weibo.com
 *  picupload.weibo.com (picupload.service.weibo.com)
 *
 *  passport.weibo.cn
 *  login.sina.com.cn
 */

import { HttpHeaders } from "./http-headers.js";
import { PConfig, PSEUDO_MOBILE_UA } from "../sharre/constant.js";

// HttpHeaders.rewriteRequest(
//     {
//         Referer: "http://photo.weibo.com/",
//         Origin: "http://photo.weibo.com",
//     },
//     {
//         urls: ["http://picupload.weibo.com/*"],
//         types: ["xmlhttprequest"],
//     },
// );
//
// HttpHeaders.rewriteRequest(
//     {
//         Referer: "https://photo.weibo.com/",
//         Origin: "https://photo.weibo.com",
//     },
//     {
//         urls: ["https://picupload.weibo.com/*"],
//         types: ["xmlhttprequest"],
//     },
// );

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

HttpHeaders.rewriteRequest(
    {
        Referer: "http://passport.weibo.cn/",
    },
    {
        urls: ["http://login.sina.com.cn/sso/*"],
        types: ["xmlhttprequest"],
    },
);

HttpHeaders.rewriteRequest(
    {
        Referer: "https://passport.weibo.cn/",
    },
    {
        urls: ["https://login.sina.com.cn/sso/*"],
        types: ["xmlhttprequest"],
    },
);

HttpHeaders.rewriteRequest(
    {
        Origin: "https://passport.weibo.cn",
        Referer: "https://passport.weibo.cn/signin/login",
        "User-Agent": PSEUDO_MOBILE_UA,
    },
    {
        urls: ["https://passport.weibo.cn/sso/login"],
        types: ["xmlhttprequest"],
    },
);

HttpHeaders.rewriteResponse(
    {
        "Access-Control-Allow-Origin": self.location.origin,
    },
    {
        urls: ["https://passport.weibo.cn/sso/login"],
        types: ["xmlhttprequest"],
    },
);

HttpHeaders.rewriteRequest(
    {
        Referer: "https://photo.weibo.com/",
        Origin: "https://photo.weibo.com",
    },
    {
        urls: PConfig.urlPrefix.map(prefix => `https://${prefix}.sinaimg.cn/*`),
        types: ["image", "main_frame", "xmlhttprequest"],
    },
);
