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

import { PSEUDO_MOBILE_UA } from "../sharre/constant.js";
import { GUID } from "./guid.js";

const rules: chrome.declarativeNetRequest.Rule[] = [
    // {
    //     id: 1,
    //     action: {
    //         type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    //         requestHeaders: [
    //             {
    //                 operation: chrome.declarativeNetRequest.HeaderOperation.SET,
    //                 header: 'Referer',
    //                 value: 'http://photo.weibo.com/',
    //             },
    //             {
    //                 operation: chrome.declarativeNetRequest.HeaderOperation.SET,
    //                 header: 'Origin',
    //                 value: 'http://photo.weibo.com',
    //             },
    //         ]
    //     },
    //     condition: {
    //         initiatorDomains: [chrome.runtime.id],
    //         urlFilter: "http://photo.weibo.com/*",
    //         resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
    //     }
    // },
    // {
    //     id: 1,
    //     action: {
    //         type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    //         requestHeaders: [
    //             {
    //                 operation: chrome.declarativeNetRequest.HeaderOperation.SET,
    //                 header: 'Referer',
    //                 value: 'http://passport.weibo.cn/',
    //             },
    //         ]
    //     },
    //     condition: {
    //         initiatorDomains: [chrome.runtime.id],
    //         urlFilter: "http://login.sina.com.cn/sso/*",
    //         resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST]
    //     }
    // },
    {
        id: 1,
        action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Referer",
                    value: "https://photo.weibo.com/",
                },
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Origin",
                    value: "https://photo.weibo.com",
                },
            ],
        },
        condition: {
            initiatorDomains: [chrome.runtime.id],
            urlFilter: "https://photo.weibo.com/*",
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
        },
    },
    {
        id: 1,
        action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Referer",
                    value: "https://passport.weibo.cn/",
                },
            ],
        },
        condition: {
            initiatorDomains: [chrome.runtime.id],
            urlFilter: "https://login.sina.com.cn/sso/*",
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
        },
    },
    {
        id: 1,
        action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Origin",
                    value: "https://photo.weibo.com",
                },
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Referer",
                    value: "https://photo.weibo.com/",
                },
            ],
        },
        condition: {
            initiatorDomains: [chrome.runtime.id],
            requestDomains: ["sinaimg.cn"],
            resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.IMAGE,
                chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
            ],
        },
    },
    {
        id: 1,
        action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Origin",
                    value: "https://passport.weibo.cn",
                },
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Referer",
                    value: "https://passport.weibo.cn/signin/login",
                },
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "User-Agent",
                    value: PSEUDO_MOBILE_UA,
                },
            ],
        },
        condition: {
            initiatorDomains: [chrome.runtime.id],
            urlFilter: "https://passport.weibo.cn/sso/login",
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
        },
    },
    {
        id: 1,
        action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            responseHeaders: [
                {
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "Access-Control-Allow-Origin",
                    value: self.location.origin,
                },
            ],
        },
        condition: {
            initiatorDomains: [chrome.runtime.id],
            urlFilter: "https://passport.weibo.cn/sso/login",
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
        },
    },
];

rules.forEach((rule) => {
    const id = GUID.generate();
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                ...rule,
                id: id,
            },
        ],
        removeRuleIds: [id],
    });
});
