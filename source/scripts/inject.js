 /*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

 /**
  * @async
  * @desc bootloader
  */
async function bootloader() {

    const {
        MAXIMUM_EDGE,
        M_VIDEO_FRAME,
        S_WITHOUT_CORS_MODE,
        S_COMMAND_POINTER_EVENTS,
    } = await import(chrome.runtime.getURL("scripts/plugin/constant.js"));
    const overrideStyle = document.createElement("link");

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === S_COMMAND_POINTER_EVENTS) {
            overrideStyle.disabled = !overrideStyle.disabled;
        }
        if (message.type === M_VIDEO_FRAME) {
            const videoRefs = document.querySelectorAll('video');
            for (const videoRef of videoRefs) {
                /**
                 * 为什么不用 video.src 的写法？
                 * <video><source src="..."></video> 这种写法不存在 video.src
                 * 但是 chrome 可以捕获 source 中的 src 值
                 */
                if (videoRef.currentSrc !== message.srcUrl) {
                    continue;
                }
                const width = Math.ceil(videoRef.videoWidth);
                const height = Math.ceil(videoRef.videoHeight);
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
                    const dataurl = canvas.toDataURL("image/jpeg", 0.95);
                    sendResponse({
                        ext: ".jpg",
                        contentType: "image/jpeg",
                        dataurl: dataurl,
                    });
                } catch (e) {
                    chrome.runtime.sendMessage({type: S_WITHOUT_CORS_MODE});
                }
                break;
            }
        }
    });

    self.addEventListener("contextmenu", e => {
        if (overrideStyle.parentElement && !overrideStyle.disabled) {
            e.stopImmediatePropagation();
        }
    }, true);

    function contentInjectionHandler() {
        const highlight = document.createElement("inject-highlight");
        const styleContent = `
            html {
                pointer-events: none !important;
            }
            iframe, embed, object, param, video, source {
                pointer-events: auto !important;
            }
            inject-highlight[data-injector-id="${chrome.runtime.id}"] {
                display: block;
                position: fixed;
                left: 0;
                top: 0;
                right: 0;
                bottom: 0;
                border: 3px solid #fff;
                outline: 3px dashed #fb0000;
                outline-offset: -3px;
                background-color: transparent;
                box-sizing: border-box;
                pointer-events: none;
                z-index: ${2 ** 31 - 1};
            }
        `;
        highlight.setAttribute("data-injector-id", chrome.runtime.id);
        overrideStyle.setAttribute("data-injector-id", chrome.runtime.id);

        /**
         * Resolve bug caused by `LeaVerou/prefixfree`
         * @see https://github.com/LeaVerou/prefixfree/issues/6131
         *
         * Problem pages are known:
         *  - http://howtoubuntu.org/things-to-do-after-installing-ubuntu-14-04-trusty-tahr#chrome
         */
        overrideStyle.setAttribute("data-noprefix", "no-conflict");

        overrideStyle.rel = "stylesheet";
        overrideStyle.href = `data:text/css;base64,${btoa(styleContent)}`;
        overrideStyle.disabled = true;
        if (document.head && document.body) {
            document.body.append(highlight);
            document.head.append(overrideStyle);
        } else {
            console.warn(`Injection failed.(Chrome Extension ID: ${chrome.runtime.id})`);
        }
    }

    if (document.readyState === "loading") {
        self.addEventListener("DOMContentLoaded", contentInjectionHandler, true);
    } else {
        contentInjectionHandler();
    }

}

bootloader();
