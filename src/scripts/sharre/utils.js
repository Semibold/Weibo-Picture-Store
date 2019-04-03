/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

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
     * @param {string} [filepath]
     * @param {string} [defFilename="image"]
     * @return {string}
     */
    static getFilenameWithoutSuffix(filepath, defFilename = "image") {
        if (filepath) {
            const filename = filepath.split("/").pop();
            const segments = filename.split(".");
            if (segments.length > 1) {
                return segments.slice(0, -1).join(".") || filename;
            } else {
                return filename;
            }
        } else {
            return defFilename;
        }
    }

    /**
     * @async
     * @param {RequestInfo} input
     * @param {RequestInit} [init]
     * @return {Promise<Response>}
     * @reject {Error|AbortError|TypeError}
     */
    static async fetch(input, init) {
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
        )
            .then(response => {
                if (response.ok) {
                    return response;
                } else {
                    throw new Error(response.statusText);
                }
            })
            .catch(reason => {
                Log.w({
                    module: "Utils.fetch",
                    message: reason,
                    remark: input,
                });
                return Promise.reject(reason);
            });
    }

    /**
     * @param {Blob|File} blob
     * @param {string} [mimeType = "image/png"]
     * @param {number} [quality = 0.9]
     * @return {Promise<Blob>}
     * @reject {Error}
     */
    static async remuxImage(blob, mimeType = "image/png", quality = 0.9) {
        const objectURL = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = e => resolve(image);
            image.onerror = e => reject(e);
            image.src = objectURL;
        })
            .then(image => {
                if (blob.type === "image/svg+xml") {
                    let maxScale = 2;
                    let minPixel = 420;
                    let maxPixel = 840;
                    if (image.naturalWidth / image.naturalHeight > 16 / 10) {
                        const scale = Math.min(maxScale, Math.sqrt(image.naturalWidth / image.naturalHeight));
                        minPixel = Math.floor(minPixel * scale);
                        maxPixel = Math.floor(maxPixel * scale);
                    }

                    // Preserve aspect ratio
                    image.width = Math.min(maxPixel, Math.max(minPixel, Math.floor(screen.width * 0.5)));
                    image.height = Math.round((image.naturalHeight / image.naturalWidth) * image.width);
                }

                const width = image.width;
                const height = image.height;
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                canvas.width = width;
                canvas.height = height;
                context.drawImage(image, 0, 0, width, height);

                return new Promise((resolve, reject) => canvas.toBlob(resolve, mimeType, quality));
            })
            .finally(() => {
                URL.revokeObjectURL(objectURL);
            });
    }

    /**
     * @param {Iterable} iterable
     * @return {Promise<{error: boolean, value: *}>}
     * @no-reject
     */
    static async settled(iterable) {
        const s = [];
        for (const item of iterable) {
            s.push(
                Promise.resolve(item)
                    .then(result => {
                        return { error: false, value: result };
                    })
                    .catch(reason => {
                        return { error: true, value: reason };
                    }),
            );
        }
        return Promise.all(s);
    }
}
