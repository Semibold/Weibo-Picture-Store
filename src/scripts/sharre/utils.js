/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { SINGLETON_CACHE } from "./constant.js";
import { Base64 } from "./base64.js";
import { Log } from "./log.js";

/**
 * @static
 * @typedef {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Uint8ClampedArray|Float32Array|Float64Array} TypedArray
 */
export class Utils {
    /**
     * @nosideeffects
     */
    static noop() {}

    /**
     * @async
     * @param {RequestInfo} input
     * @param {RequestInit} [init]
     * @return {Promise<Response>}
     */
    static fetch(input, init) {
        return fetch(
            input,
            Object.assign(
                {
                    method: "GET",
                    mode: "cors",
                    credentials: "include",
                    cache: "default",
                    redirect: "follow",
                    referrer: "client",
                },
                init,
            ),
        ).catch(reason => {
            Log.w({
                module: "Utils.fetch",
                message: reason,
                remark: input,
            });
            return Promise.reject(reason);
        });
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
     * @param {ArrayBufferLike|ArrayLike<number>|TypedArray} buffer
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
     * @param {Object} obj
     * @return {string}
     */
    static createJsonDataURL(obj) {
        const text = Base64.encode(JSON.stringify(obj));
        return `data:application/json;base64,${text}`;
    }

    /**
     * @param {Function} func - MUST be a parameterless function
     * @return {Promise<*>}
     */
    static singleton(func) {
        if (!SINGLETON_CACHE.has(func)) {
            SINGLETON_CACHE.set(
                func,
                func().finally(() => {
                    SINGLETON_CACHE.delete(func);
                }),
            );
        }
        return SINGLETON_CACHE.get(func);
    }
}
