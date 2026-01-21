/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc background only
 * @desc for `Utils.log` only
 */

import { Isomorphic } from "./isomorphic.js";
import { PConfig } from "./constant.js";

/**
 * @static
 */
export class Utils {
    /**
     * @async
     * @no-reject
     * @desc for all context
     */
    static get log() {
        return {
            d(data: WB.LogErrDetail) {
                Isomorphic.addBackgroundLog(data, "debug");
            },
            w(data: WB.LogErrDetail) {
                Isomorphic.addBackgroundLog(data, "warn");
            },
            e(data: WB.LogErrDetail) {
                Isomorphic.addBackgroundLog(data, "error");
            },
        };
    }

    static get isBackground(): boolean {
        try {
            const backWindow = chrome.extension.getBackgroundPage();
            if (backWindow) {
                return backWindow === self;
            } else {
                return !(self.document && self.document.body);
            }
        } catch (e) {
            return !(self.document && self.document.body);
        }
    }

    /**
     * @nosideeffects
     */
    static noop(): undefined {}

    static isValidURL(maybeURL: string): boolean {
        try {
            new URL(maybeURL);
            return true;
        } catch (e) {
            return false;
        }
    }

    static buildURL(url: string, param: Record<string, any>): string {
        const base = new URL(url);
        const searchParams = Utils.createSearchParams(param, base.search);
        base.search = searchParams.toString();
        return base.href;
    }

    static createSearchParams(
        param: Record<string, any>,
        init?: string | URLSearchParams | string[][] | Record<string, string>,
    ): URLSearchParams {
        const searchParams = new URLSearchParams(init);
        if (param) {
            for (const [key, value] of Object.entries(param)) {
                searchParams.set(key, value);
            }
        }
        return searchParams;
    }

    /**
     * @desc NOT suitable for service worker
     */
    static parseHTML(text: string, mimeType: DOMParserSupportedType = "text/html"): DocumentFragment {
        const parser = new DOMParser();
        const context = parser.parseFromString(text, mimeType);
        const children = context.body.children;
        const fragment = new DocumentFragment();
        fragment.append(...children);
        return fragment;
    }

    static randomString(n = 0): string {
        const buffer = [];
        const charPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        while (n--) {
            buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
        }
        return buffer.join("");
    }

    /**
     * @desc Be Careful: It's not equal to TextEncoder.encode();
     */
    static bufferFromText(byteSequence = ""): Uint8Array {
        const bufferView = new Uint8Array(byteSequence.length);
        for (let i = 0; i < byteSequence.length; i++) {
            bufferView[i] = byteSequence.codePointAt(i);
        }
        return bufferView;
    }

    /**
     * @desc Be Careful: It's not equal to TextDecoder.decode();
     */
    static textFromBuffer(buffer: ArrayBufferLike): string {
        const r = [];
        const bufferView = new Uint8Array(buffer);
        for (let i = 0; i < bufferView.byteLength; i++) {
            r.push(String.fromCodePoint(bufferView[i]));
        }
        return r.join("");
    }

    static safeMixinError(
        literals: TemplateStringsArray,
        ...placeholders: (string | Error | DOMException | any)[]
    ): string {
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
     * @desc NOT suitable for service worker
     */
    static writeToClipboard(content: string): boolean {
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

    static getFilenameWithoutSuffix(filepath?: string, defFilename = "image"): string {
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

    static replaceUrlScheme(
        target: string,
        targetScheme: string,
        variousScheme = [/^http:\/\//i, /^https:\/\//i, /^\/\//i],
    ): string {
        for (const s of variousScheme) {
            if (s.test(target)) {
                return target.replace(s, targetScheme);
            }
        }
        return target;
    }

    static clampClientSize(clientSize: WB.ClipSize, maxClientSize = 16 * 1024): WB.ClipSize {
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
     * @reject {Error|AbortError|TypeError}
     */
    static async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
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
            .then((response) => {
                if (response.ok) {
                    return response;
                } else {
                    throw new Error(response.statusText);
                }
            })
            .catch((reason) => {
                Utils.log.w({
                    module: "Utils.fetch",
                    error: Utils.safeMixinError`input: ${input}; reason: ${reason}`,
                });
                return Promise.reject(reason);
            });
    }

    /**
     * @async
     * @desc NOT suitable for service worker
     * @reject {Promise<Error>}
     */
    static async convertImage(blob: Blob, mimeType = "image/png", quality = 0.9): Promise<Blob> {
        const svgType = blob.type === "image/svg+xml";
        const objectURL = URL.createObjectURL(blob);
        const dataURL = svgType ? await Utils.readAsChannelType(blob, "dataURL") : null;

        return new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = (e) => resolve(image);
            image.onerror = (e) => reject(e);

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
        }).then(async (image) => {
            // Set svg image width and height correctly.
            if (svgType) {
                try {
                    const text = await Utils.readAsChannelType(blob, "text");
                    const node = Utils.parseHTML(text);
                    const svg = node.firstElementChild as SVGRectElement;

                    image.width = svg.width.baseVal.value;
                    image.height = svg.height.baseVal.value;
                } catch (e) {
                    Utils.log.w({
                        module: "Utils.convertImage",
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

            return new Promise((resolve, reject) =>
                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                        URL.revokeObjectURL(objectURL);
                    },
                    mimeType,
                    quality,
                ),
            );
        });
    }

    /**
     * @async
     * @desc 不支持 SVG
     */
    static async convertBitmap(blob: Blob, mimeType = "image/png", quality = 0.9) {
        const imgBitmap = await createImageBitmap(blob);
        const naturalWidth = imgBitmap.width;
        const naturalHeight = imgBitmap.height;
        const maxScale = 4;
        const screenWidth = 1920;

        let width = imgBitmap.width;
        let height = imgBitmap.height;
        let minPixel = 480;
        let maxPixel = 1920;

        if (naturalWidth / naturalHeight > 16 / 10) {
            const scale = Math.min(maxScale, Math.sqrt(naturalWidth / naturalHeight));
            minPixel = Math.floor(minPixel * scale);
            maxPixel = Math.floor(maxPixel * scale);
        }

        // Preserve aspect ratio
        width = Math.min(maxPixel, Math.max(minPixel, Math.floor(screenWidth * 0.8)));
        height = Math.round((naturalHeight / naturalWidth) * width);

        const size = Utils.clampClientSize({ width, height });

        width = size.width;
        height = size.height;

        const dpr = self.devicePixelRatio || 1;
        const offscreenCanvas = new OffscreenCanvas(Math.ceil(width * dpr), Math.ceil(height * dpr));
        const context = offscreenCanvas.getContext("2d");

        context.scale(dpr, dpr);
        context.drawImage(imgBitmap, 0, 0, width, height);
        imgBitmap.close();

        return offscreenCanvas.convertToBlob({ type: mimeType, quality: quality });
    }

    /**
     * @async
     * @deprecated Use `blob.arrayBuffer()` instead of `readAsChannelType(blob, 'arrayBuffer')`.
     * @param {Blob} blob
     * @param {"arrayBuffer"|"binaryString"|"dataURL"|"text"} channelType
     * @return {Promise<string|ArrayBuffer>}
     * @reject {Promise<Error>}
     */
    static async readAsChannelType(blob: Blob, channelType: "arrayBuffer"): Promise<ArrayBuffer>;
    static async readAsChannelType(blob: Blob, channelType: "binaryString" | "dataURL" | "text"): Promise<string>;
    static async readAsChannelType(blob: Blob, channelType: string): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = (e) => {
                if (reader.readyState === reader.DONE) {
                    resolve(reader.result);
                } else {
                    Utils.log.w({
                        module: "Utils.readAsChannelType",
                        error: reader.error || "Unknown error",
                    });
                    reject(reader.error || new Error("Unknown error"));
                }
            };

            switch (channelType) {
                case "arrayBuffer":
                    reader.readAsArrayBuffer(blob);
                    break;
                case "binaryString":
                    reader.readAsBinaryString(blob);
                    break;
                case "dataURL":
                    reader.readAsDataURL(blob);
                    break;
                case "text":
                    reader.readAsText(blob);
                    break;
                default:
                    throw new Error("Invalid `channelType`");
            }
        });
    }

    static async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(() => resolve(), ms));
    }

    /**
     * @desc Supported Placeholder
     *      - {{pid}}       - "006G4xsfgy1h8pbgtnqirj30u01hlqv5"
     *      - {{extname}}   - ".jpg"
     *      - {{basename}}  - "006G4xsfgy1h8pbgtnqirj30u01hlqv5.jpg"
     */
    static genExternalUrl(scheme: string, clip: string, pid: string, suffix: string) {
        const validPlaceholder = ["{{pid}}", "{{extname}}", "{{basename}}"];
        const sterilizedClip = clip.trim();
        const hasPlaceholder = validPlaceholder.some((placeholder) => sterilizedClip.includes(placeholder));

        if (hasPlaceholder) {
            const protocolStartIndex = sterilizedClip.search("//");
            const urlWithoutProtocol =
                protocolStartIndex < 0 ? sterilizedClip : sterilizedClip.slice(protocolStartIndex + 2);
            const replacedPlaceholderUrl = urlWithoutProtocol
                .replace("{{pid}}", pid)
                .replace("{{extname}}", suffix)
                .replace("{{basename}}", pid + suffix);
            return scheme + replacedPlaceholderUrl;
        }
        return `${scheme + PConfig.randomImageHost}/${sterilizedClip}/${pid + suffix}`;
    }

    /**
     * @desc Call `chrome.notifications.creat()`
     * @desc NOT suitable for content script
     */
    static notify(
        notificationId: string,
        options: chrome.notifications.NotificationOptions,
        callback?: (notificationId: string) => void,
    ): void;
    static notify(options: chrome.notifications.NotificationOptions, callback?: (notificationId: string) => void): void;
    static notify(arg1: any, arg2?: any, arg3?: any): void {
        if (typeof arg1 === "string") {
            return chrome.notifications.create(
                arg1 + "@" + crypto.randomUUID(),
                Object.assign(
                    {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("notify_icon"),
                        title: chrome.i18n.getMessage("info_title"),
                    },
                    arg2,
                ),
                arg3,
            );
        } else {
            return chrome.notifications.create(
                Object.assign(
                    {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("notify_icon"),
                        title: chrome.i18n.getMessage("info_title"),
                    },
                    arg1,
                ),
                arg2,
            );
        }
    }
}
