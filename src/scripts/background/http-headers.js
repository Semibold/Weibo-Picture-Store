/*
 * Copyright (c) 2019 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @static
 */
export class HttpHeaders {
    /**
     * @private
     * @param {"responseHeaders"|"requestHeaders"} type
     * @param {Object.<string, string|null>} obj
     * @return {Function}
     */
    static getHeadersHandler(type, obj) {
        return details => {
            const result = [];
            const keyMap = new Map();
            Object.keys(obj).forEach(name => keyMap.set(name.toLowerCase(), name));
            for (const header of details[type]) {
                const lowerCaseName = header.name.toLowerCase();
                if (keyMap.has(lowerCaseName)) {
                    const name = keyMap.get(lowerCaseName);
                    if (obj[name]) {
                        result.push({ name: header.name, value: obj[name] });
                    } else {
                        // In this case, discard/delete this header.
                    }
                    keyMap.delete(lowerCaseName);
                } else {
                    result.push(header);
                }
            }
            keyMap.forEach(name => {
                if (obj[name]) {
                    result.push({ name: name, value: obj[name] });
                } else {
                    // In this case, ignore this item.
                }
            });
            keyMap.clear();
            return { [type]: result };
        };
    }

    /**
     * @public
     * @param {Object.<string, string|null>} obj
     * @param {chrome.webRequest.RequestFilter} filter
     * @return {Function}
     */
    static rewriteRequest(obj, filter) {
        const handler = HttpHeaders.getHeadersHandler("requestHeaders", obj);
        const extraInfoSpec = ["requestHeaders", "blocking"];
        const CONTEXT_OPTIONS = chrome.webRequest["OnBeforeSendHeadersOptions"];
        /**
         * Starting from Chrome 72, the following request headers are not provided and cannot be modified or
         * removed without specifying 'extraHeaders' in opt_extraInfoSpec:
         *      - Accept-Language
         *      - Accept-Encoding
         *      - Referer
         *      - Cookie
         */
        if (CONTEXT_OPTIONS["EXTRA_HEADERS"]) {
            extraInfoSpec.push("extraHeaders");
        }
        chrome.webRequest.onBeforeSendHeaders.addListener(handler, filter, extraInfoSpec);
        return () => {
            if (chrome.webRequest.onBeforeSendHeaders.hasListener(handler)) {
                chrome.webRequest.onBeforeSendHeaders.removeListener(handler);
            }
        };
    }

    /**
     * @public
     * @param {Object.<string, string|null>} obj
     * @param {chrome.webRequest.RequestFilter} filter
     * @return {Function}
     */
    static rewriteResponse(obj, filter) {
        const handler = HttpHeaders.getHeadersHandler("responseHeaders", obj);
        const extraInfoSpec = ["responseHeaders", "blocking"];
        const CONTEXT_OPTIONS = chrome.webRequest["OnHeadersReceivedOptions"];
        /**
         * Starting from Chrome 72, the Set-Cookie response header is not provided and cannot be modified or
         * removed without specifying 'extraHeaders' in opt_extraInfoSpec.
         */
        if (CONTEXT_OPTIONS["EXTRA_HEADERS"]) {
            extraInfoSpec.push("extraHeaders");
        }
        chrome.webRequest.onHeadersReceived.addListener(handler, filter, extraInfoSpec);
        return () => {
            if (chrome.webRequest.onHeadersReceived.hasListener(handler)) {
                chrome.webRequest.onHeadersReceived.removeListener(handler);
            }
        };
    }
}
