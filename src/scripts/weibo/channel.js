/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Base64 } from "../sharre/base64.js";
import { bitmapMime } from "../sharre/bitmap-mime.js";

/**
 * @export
 * @desc 微博图片的两种上传方式
 */
export const channel = new Proxy(
    {
        arrayBuffer: {
            readType: "readAsArrayBuffer",
            body(arrayBuffer) {
                return arrayBuffer;
            },
            param(...args) {
                return Object.assign(
                    {
                        s: "xml",
                        ori: "1",
                        data: "1",
                        rotate: "0",
                        wm: "",
                        app: "miniblog",
                        mime: "image/jpeg",
                    },
                    ...args,
                );
            },
            mimeType(arrayBuffer, blob = null) {
                if (blob && blob.type === "image/svg+xml") {
                    return blob.type;
                }
                return bitmapMime(arrayBuffer);
            },
        },
        dataURL: {
            readType: "readAsDataURL",
            body(dataURL) {
                const formData = new FormData();
                formData.set("b64_data", dataURL.split(",")[1]);
                return formData;
            },
            param(...args) {
                return Object.assign(
                    {
                        s: "xml",
                        ori: "1",
                        data: "base64",
                        rotate: "0",
                        wm: "",
                        app: "miniblog",
                        mime: "image/jpeg",
                    },
                    ...args,
                );
            },
            mimeType(dataURL, blob = null) {
                if (blob && blob.type === "image/svg+xml") {
                    return blob.type;
                }
                return bitmapMime(Base64.toBuffer(dataURL.split(",")[1]));
            },
        },
    },
    {
        get(target, key, receiver) {
            switch (key) {
                case "arrayBuffer":
                    return Reflect.get(target, "arrayBuffer", receiver);
                case "dataURL":
                    return Reflect.get(target, "dataURL", receiver);
                default:
                    throw new Error("Invalid key. Key must be `arrayBuffer` or `dataURL`");
            }
        },
    },
);
