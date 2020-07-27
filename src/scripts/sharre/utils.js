/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Log } from "./log.js";

/**
 * @static
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
     * @param {string|URLSearchParams|string[][]|Object<string,string>} [init]
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
     * @param {string} text
     * @param {SupportedType} [mimeType="text/html"]
     * @return {DocumentFragment}
     */
    static parseHTML(text, mimeType = "text/html") {
        const parser = new DOMParser();
        const context = parser.parseFromString(text, mimeType);
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
     * @param {number|ArrayBufferLike|ArrayLike<number>|TypedArray} buffer
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
     * @param {TemplateStringsArray} literals
     * @param {string|Error|DOMError|DOMException|Object} placeholders
     * @return {string}
     */
    static safeMixinError(literals, ...placeholders) {
        let result = "";

        // interleave the literals with the placeholders
        for (let i = 0; i < placeholders.length; i++) {
            let item = placeholders[i];
            let segment = "";

            if (item) {
                if (typeof item === "string") {
                    segment = item;
                } else {
                    if (typeof item.message === "string") {
                        segment = item.message;
                    } else {
                        try {
                            segment = JSON.stringify(item);
                        } catch (e) {
                            console.warn(e);
                        }
                    }
                }
            }

            result += literals[i];
            result += segment;
        }

        // add the last literal
        result += literals[literals.length - 1];
        return result;
    }

    /**
     * @param {string} content
     * @return {boolean}
     */
    static writeToClipboard(content) {
        /** @type Range */
        const range = document.createRange();
        const selection = document.getSelection();
        /** @type HTMLPreElement */
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
                return filename || defFilename;
            }
        } else {
            return defFilename;
        }
    }

    /**
     * @param {string} target
     * @param {string} targetScheme
     * @param {RegExp[]} [variousScheme]
     * @return string
     */
    static replaceUrlScheme(target, targetScheme, variousScheme = [/^http:\/\//i, /^https:\/\//i, /^\/\//i]) {
        for (const s of variousScheme) {
            if (s.test(target)) {
                return target.replace(s, targetScheme);
            }
        }
        return target;
    }

    /**
     * @typedef {Object} ClientSize
     * @property {number} width
     * @property {number} height
     */

    /**
     * @param {ClientSize} clientSize
     * @param {int} [maxClientSize = 16 * 1024]
     * @return {ClientSize}
     */
    static clampClientSize(clientSize, maxClientSize = 16 * 1024) {
        const dpr = self.devicePixelRatio || 1;
        const result = Object.assign({}, clientSize);

        const width = Math.ceil(result.width * dpr);
        if (width > maxClientSize) {
            const ratio = width / maxClientSize;
            result.width = result.width / ratio;
            result.height = result.height / ratio;
        }

        const height = Math.ceil(result.height * dpr);
        if (height > maxClientSize) {
            const ratio = height / maxClientSize;
            result.width = result.width / ratio;
            result.height = result.height / ratio;
        }

        return result;
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
                    // response
                    //     .clone()
                    //     .text()
                    //     .then(text => {
                    //         Log.d({
                    //             module: "Utils.fetch",
                    //             error: Utils.safeMixinError`input: ${input}; response: ${text}`,
                    //         });
                    //     });
                    return response;
                } else {
                    throw new Error(response.statusText);
                }
            })
            .catch(reason => {
                Log.w({
                    module: "Utils.fetch",
                    error: Utils.safeMixinError`input: ${input}; reason: ${reason}`,
                });
                return Promise.reject(reason);
            });
    }

    /**
     * @async
     * @param {Blob|File} blob
     * @param {string} [mimeType = "image/png"]
     * @param {number} [quality = 0.9]
     * @return {Promise<Blob>}
     * @reject {Promise<Error>}
     */
    static async remuxImage(blob, mimeType = "image/png", quality = 0.9) {
        const svgType = blob.type === "image/svg+xml";
        const objectURL = URL.createObjectURL(blob);
        const dataURL = svgType ? await Utils.readAsChannelType(blob, "dataURL") : null;

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = e => resolve(image);
            image.onerror = e => reject(e);

            /**
             * @bug Canvas is tainted on WebKit Rendering Engine after drawing binary SVGImage including <foreignObject>
             * @see TestCase - http://jsfiddle.net/KUH89/1/
             *
             * @desc A canvas should not be tainted if it draws a dataURL SVGImage with a <foreignObject>
             * @see https://bugs.webkit.org/show_bug.cgi?id=180301
             * @see https://bugs.chromium.org/p/chromium/issues/detail?id=294129
             */
            if (svgType && dataURL) {
                image.src = dataURL;
            } else {
                image.src = objectURL;
            }
        })
            .then(async image => {
                // Set svg image width and height correctly.
                if (svgType) {
                    try {
                        const text = await Utils.readAsChannelType(blob);
                        const node = Utils.parseHTML(text);
                        const svg = node.firstElementChild;

                        image.width = svg.width.baseVal.value;
                        image.height = svg.height.baseVal.value;
                    } catch (e) {
                        Log.w({
                            module: "Utils.remuxImage",
                            error: e,
                        });

                        let maxScale = 4;
                        let minPixel = 480;
                        let maxPixel = 1920;
                        if (image.naturalWidth / image.naturalHeight > 16 / 10) {
                            const scale = Math.min(maxScale, Math.sqrt(image.naturalWidth / image.naturalHeight));
                            minPixel = Math.floor(minPixel * scale);
                            maxPixel = Math.floor(maxPixel * scale);
                        }

                        // Preserve aspect ratio
                        image.width = Math.min(maxPixel, Math.max(minPixel, Math.floor(screen.width * 0.8)));
                        image.height = Math.round((image.naturalHeight / image.naturalWidth) * image.width);
                    }
                }

                const size = Utils.clampClientSize({
                    width: image.width,
                    height: image.height,
                });

                image.width = size.width;
                image.height = size.height;

                const width = image.width;
                const height = image.height;
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const dpr = self.devicePixelRatio || 1;

                canvas.width = Math.ceil(width * dpr);
                canvas.height = Math.ceil(height * dpr);
                context.scale(dpr, dpr);
                context.drawImage(image, 0, 0, width, height);

                return new Promise((resolve, reject) => canvas.toBlob(resolve, mimeType, quality));
            })
            .finally(() => {
                URL.revokeObjectURL(objectURL);
            });
    }

    /**
     * @async
     * @param {Blob|File} blob
     * @param {"arrayBuffer"|"binaryString"|"dataURL"|"text"} channelType
     * @return {Promise<string|ArrayBuffer>}
     * @reject {Promise<Error>}
     */
    static async readAsChannelType(blob, channelType = "text") {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            let readType = "readAsText";

            switch (channelType) {
                case "arrayBuffer":
                    readType = "readAsArrayBuffer";
                    break;
                case "binaryString":
                    readType = "readAsBinaryString";
                    break;
                case "dataURL":
                    readType = "readAsDataURL";
                    break;
                case "text":
                    readType = "readAsText";
                    break;
                default:
                    throw new Error("Invalid `channelType`");
            }

            reader.onloadend = e => {
                if (reader.readyState === reader.DONE) {
                    resolve(reader.result);
                } else {
                    Log.w({
                        module: "Utils.readAsChannelType",
                        error: reader.error || "Unknown error",
                    });
                    reject(reader.error || new Error("Unknown error"));
                }
            };
            reader[readType](blob);
        });
    }

    /**
     * @async
     * @param {Iterable} iterable
     * @return {Promise<{error: boolean, value: *}[]>}
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
