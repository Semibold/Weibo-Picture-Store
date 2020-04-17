/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

// import(chrome.runtime.getURL("scripts/inject/pointer-event.js")).catch(e => {
//     console.warn("[Weibo-Picture-Store]:", e);
// });

/**
 * Firefox workaround
 * Content of `pointer-event.js` file
 */

async function getBrowserInternalUuid() {
    const manifest = chrome.runtime.getManifest();
    const settings = manifest.browser_specific_settings || {};
    if (settings.gecko) {
        const url = new URL(chrome.runtime.getURL("/"));
        const uuid = url.hostname;
        if (!/^[a-zA-Z0-9-]+$/.test(uuid)) {
            console.warn(`[Weibo-Picture-Store]: "${uuid}" is an invalid string`);
        }
        return uuid;
    }
    return chrome.runtime.id;
}

async function installScripts() {
    const MAXIMUM_EDGE = 2 ** 15 - 1;
    const M_UPLOAD_FRAME = "menu_upload_frame";
    const S_WITHOUT_CORS_MODE = "signal_without_cors_mode";
    const S_COMMAND_POINTER_EVENTS = "signal_command_pointer_events";

    const extensionId = await getBrowserInternalUuid();
    const attribute = `data-${extensionId}`;
    const lightMark = document.createElement("mark");

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === S_COMMAND_POINTER_EVENTS) {
            if (lightMark.parentElement) {
                document.documentElement.removeAttribute(attribute);
                lightMark.remove();
            } else {
                if (document.body) {
                    lightMark.dataset.injector = extensionId;
                    document.documentElement.setAttribute(attribute, "");
                    document.body.append(lightMark);
                }
            }
        }
        if (message.type === M_UPLOAD_FRAME) {
            const videoHandler = videoRef => {
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
            };

            if (
                message.info &&
                message.info.targetElementId != null &&
                chrome.menus &&
                typeof chrome.menus.getTargetElement === "function"
            ) {
                /**
                 * @desc Firefox only. chrome.contextMenus.onClick can handle the events.
                 * @desc Need `menus` permission
                 */
                const videoRef = chrome.menus.getTargetElement(message.info.targetElementId);
                if (videoRef && videoRef.tagName && videoRef.tagName.toLowerCase() === "video") {
                    videoHandler(videoRef);
                }
            } else {
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
                    videoHandler(videoRef);
                    break;
                }
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
}

installScripts().catch(e => console.warn("[Weibo-Picture-Store]:", e));
