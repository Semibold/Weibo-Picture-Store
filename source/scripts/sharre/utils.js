/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @static
 */
export class Utils {

    /**
     * @nosideeffects
     */
    static noop() {}

    /**
     * @param {number} [future] - seconds
     * @return {number} - seconds
     */
    static time(future = 0) {
        return Math.floor(Date.now() / 1000) + future;
    }

    /**
     * @async
     * @param {RequestInfo} input
     * @param {RequestInit} [init]
     * @return {Promise<Response>}
     */
    static fetch(input, init) {
        return fetch(input, Object.assign({
            method: "GET",
            mode: "cors",
            credentials: "include",
            cache: "default",
            redirect: "follow",
            referrer: "client",
        }, init));
    }

    /**
     * @param {string} maybeURL
     * @return {boolean}
     */
    static isValidURL(maybeURL) {
        try {
            new URL(maybeURL);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @param {string} url
     * @param {Object} [param]
     * @return {string}
     */
    static buildURL(url, param) {
        const base = new URL(url);
        const searchParams = Utils.createSearchParams(param, base.search);
        base.search = searchParams.toString();
        return base.href;
    }

    /**
     * @param {Object} [param]
     * @param {string|URLSearchParams} [init]
     * @return {URLSearchParams}
     */
    static createSearchParams(param, init) {
        const searchParams = new URLSearchParams(init);
        if (param) {
            for (const [key, value] of Object.entries(param)) {
                searchParams.set(key, value);
            }
        }
        return searchParams;
    }

    /**
     * @param {Object} obj
     * @return {FormData}
     */
    static createFormData(obj) {
        const formData = new FormData();
        for (const [k, v] of Object.entries(obj)) {
            formData.set(k, v);
        }
        return formData;
    }

    /**
     * @param {string} html
     * @return {DocumentFragment}
     */
    static parseHTML(html) {
        const parser = new DOMParser();
        const context = parser.parseFromString(html, "text/html");
        const children = context.body.children;
        const fragment = new DocumentFragment();
        fragment.append(...children);
        return fragment;
    }

    /**
     * @param {number} n
     * @return {string}
     */
    static randomString(n = 0) {
        const buffer = [];
        const charPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        while (n--) {
            buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
        }
        return buffer.join("");
    }

    /**
     * @desc Be Careful: It's not equal to TextEncoder.encode();
     * @param {string} byteSequence
     * @return {Uint8Array}
     */
    static bufferFromText(byteSequence = "") {
        const bufferView = new Uint8Array(byteSequence.length);
        for (let i = 0; i < byteSequence.length; i++) {
            bufferView[i] = byteSequence.codePointAt(i);
        }
        return bufferView;
    }

    /**
     * @desc Be Careful: It's not equal to TextDecoder.decode();
     * @param {ArrayBufferLike|ArrayLike<number>} buffer
     * @return {string}
     */
    static textFromBuffer(buffer) {
        const r = [];
        const bufferView = new Uint8Array(buffer);
        for (let i = 0; i < bufferView.byteLength; i++) {
            r.push(String.fromCodePoint(bufferView[i]));
        }
        return r.join("");
    }

    /**
     * @param {ArrayBufferLike[]|ArrayLike<number>[]} list
     * @return {Uint8Array}
     */
    static bufferConcat(list) {
        const totalLength = list.reduce((pv, cv) => pv + cv.byteLength, 0);
        const bufferView = new Uint8Array(totalLength);
        list.reduce((pv, cv) => {
            bufferView.set(new Uint8Array(cv), pv);
            return pv + cv.byteLength;
        }, 0);
        return bufferView;
    }

    /**
     * @param {ArrayBufferLike|ArrayLike<number>} buffer
     * @return {string} - Lowercase hexits
     */
    static hexitFromBuffer(buffer) {
        const bv = new Uint8Array(buffer);
        return Array.from(bv).map(x => x.toString(16).padStart(2, "0")).join("").toLowerCase();
    }

    /**
     * @param {string} content
     * @return {boolean}
     */
    static writeToClipboard(content) {
        const range = document.createRange();
        const selection = document.getSelection();
        const container = document.createElement("pre");
        container.textContent = content;
        document.body.append(container);
        range.selectNodeContents(container);
        selection.removeAllRanges();
        selection.addRange(range);
        const result = document.execCommand("copy");
        container.remove();
        return result;
    }

    /**
     * @param {string} text
     * @return {Document}
     */
    static parseXML(text) {
        return new DOMParser().parseFromString(text, "text/xml");
    }

    /**
     * @param {Node} node
     * @return {string}
     */
    static serializeXML(node) {
        return new XMLSerializer().serializeToString(node);
    }

    /**
     * @param {string} dirpath
     * @return {string}
     */
    static formatDirpath(dirpath = "") {
        dirpath = dirpath.trim();
        if (!dirpath.startsWith("/")) {
            dirpath = "/" + dirpath;
        }
        while (dirpath.endsWith("/")) {
            dirpath = dirpath.slice(0 ,-1);
        }
        return dirpath;
    }

}
