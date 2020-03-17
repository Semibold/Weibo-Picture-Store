/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { MAXIMUM_EDGE, M_UPLOAD_FRAME, S_WITHOUT_CORS_MODE, S_COMMAND_POINTER_EVENTS } from "../sharre/constant.js";

const attribute = `data-${chrome.runtime.id}`;
const lightMark = document.createElement("mark");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === S_COMMAND_POINTER_EVENTS) {
        if (lightMark.parentElement) {
            document.documentElement.removeAttribute(attribute);
            lightMark.remove();
        } else {
            if (document.body) {
                lightMark.dataset.injector = chrome.runtime.id;
                document.documentElement.setAttribute(attribute, "");
                document.body.append(lightMark);
            }
        }
    }
    if (message.type === M_UPLOAD_FRAME) {
        const videoRefs = document.querySelectorAll("video");
        for (const videoRef of videoRefs) {
            /**
             * @desc 为什么不用 video.src 的写法？
             *          <video><source src="..."></video> 这种写法不存在 video.src
             *          但是 chrome 可以捕获 source 中的 src 值
             * @todo 如果视频的URL经过了重定向，这里的判断是否正确呢？
             */
            if (videoRef.currentSrc !== message.srcUrl) {
                continue;
            }
            const width = videoRef.videoWidth;
            const height = videoRef.videoHeight;
            if (width === 0 || height === 0) {
                return;
            }
            if (width > MAXIMUM_EDGE || height > MAXIMUM_EDGE) {
                return;
            }
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;
            context.drawImage(videoRef, 0, 0, width, height);
            try {
                const dataURL = canvas.toDataURL("image/jpeg", 0.9);
                sendResponse({ dataURL: dataURL });
            } catch (e) {
                chrome.runtime.sendMessage({ type: S_WITHOUT_CORS_MODE });
            }
            break;
        }
    }
});

document.addEventListener(
    "contextmenu",
    e => {
        if (lightMark.parentElement) {
            e.stopImmediatePropagation();
        }
    },
    true,
);
