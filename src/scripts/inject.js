/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @async
 * @desc bootloader
 */
async function bootloader(startup) {

    const {
        MAXIMUM_EDGE,
        M_VIDEO_FRAME,
        S_WITHOUT_CORS_MODE,
        S_REQUEST_USER_CARD,
        S_COMMAND_POINTER_EVENTS,
        K_DISPLAY_USER_CARD,
    } = await import(chrome.runtime.getURL("scripts/sharre/constant.js"));
    const {Utils} = await import(chrome.runtime.getURL("scripts/sharre/utils.js"));

    const weiboCard = document.createElement("x-weibo-card");
    const weiboCardId = "x-weibo-card";
    const pointerEventsIndication = document.createElement("link");
    const mouseEventMetadata = {clientX: 0, clientY: 0, lastOverTarget: null, lastImgTarget: null, animation: null};
    const timers = {mouseover: null, mouseout: null};
    const predfinedQueues = [];
    const predfinedStyles = [
        `https://img.t.sinajs.cn/t6/style/css/module/base/frame.css?__rnd=${startup}`,
        `https://img.t.sinajs.cn/t6/style/css/module/combination/extra.css?__rnd=${startup}`,
    ];
    const customizeStyles = [`
        #${weiboCardId} {
            font: 12px/1.3 Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","WenQuanYi Micro Hei",sans-serif;
            color: #333;
            transform: translate(-50%, -100%);
        }
        a[action-type="setRemark"],
        a[action-type="unFollow"],
        a[action-type="follow_recommend_arr"],
        a[action-type="webim.conversation"],
        a[node-type="more"] {
            cursor: default !important;
        }`,
    ];

    weiboCard.attachShadow({mode: "open"});
    weiboCard.setAttribute("data-pending", true);
    weiboCard.setAttribute("data-injector", chrome.runtime.id);
    weiboCard.addEventListener("mousemove", e => e.stopPropagation(), true);
    pointerEventsIndication.setAttribute("data-injector", chrome.runtime.id);

    for (const url of predfinedStyles) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        predfinedQueues.push(new Promise((resolve, reject) => {
            link.onload = e => resolve();
            link.onerror = e => reject();
        }));
        weiboCard.shadowRoot.appendChild(link);
    }
    for (const text of customizeStyles) {
        const style = document.createElement("style");
        style.textContent = text;
        weiboCard.shadowRoot.appendChild(style);
    }

    Promise.all(predfinedQueues).then(() => {
        weiboCard.removeAttribute("data-pending");
    });

    function changeWeiboCardPosition() {
        const layer = weiboCard.shadowRoot.getElementById(weiboCardId);
        if (!layer) return;

        const layerRect = layer.getBoundingClientRect();
        const margin = 8;
        const padding = {
            top: layerRect.height + margin * 2,     // 包含鼠标指针的距离
            left: layerRect.width / 2 + margin,
            bottom: margin,
            right: layerRect.width / 2 + margin,
        };
        const viewRect = {
            x: padding.left,
            y: padding.top,
            top: padding.top,
            left: padding.left,
            right: document.scrollingElement.clientWidth - padding.right,
            bottom: document.scrollingElement.clientHeight - padding.bottom,
            width: document.scrollingElement.clientWidth - layerRect.width - margin * 2,
            height: document.scrollingElement.clientHeight - layerRect.height - margin * 2,
        };
        const result = {
            clientX: mouseEventMetadata.clientX,
            clientY: mouseEventMetadata.clientY,
        };

        if (viewRect.width > 0) {
            result.clientX = Math.max(result.clientX, viewRect.left);
            result.clientX = Math.min(result.clientX, viewRect.right);
        }

        if (viewRect.height > 0) {
            result.clientY = Math.max(result.clientY, viewRect.top);
            result.clientY = Math.min(result.clientY, viewRect.bottom);
        }

        /**
         * @see https://blog.chromium.org/2018/03/chrome-66-beta-css-typed-object-model.html
         * @since Chrome 66
         */
        weiboCard.attributeStyleMap.set("top", CSS.px(result.clientY));
        weiboCard.attributeStyleMap.set("left", CSS.px(result.clientX));
    }

    function createWeiboCard(response) {
        const node = Utils.parseHTML(`
            <div class="W_layer W_layer_pop" id="${weiboCardId}">
                <div class="content">
                    <div class="layer_personcard">${response["data"]}</div>
                    <!-- Arrow -->
                </div>
            </div>`);
        const prevWeiboCardContent = weiboCard.shadowRoot.getElementById(weiboCardId);

        if (prevWeiboCardContent) {
            prevWeiboCardContent.replaceWith(node);
        } else {
            weiboCard.shadowRoot.appendChild(node);
        }
        if (!weiboCard.parentElement) {
            document.body.appendChild(weiboCard);
        }
        /**
         * @desc 在动画触发之前更新到近似位置，避免大幅度运动的动画效果
         */
        changeWeiboCardPosition();

        weiboCard.hidden = false;
        Promise.all(predfinedQueues).then(() => {
            if (mouseEventMetadata.animation) {
                mouseEventMetadata.animation.playbackRate = 1;
            } else {
                mouseEventMetadata.animation = weiboCard.animate([{
                    opacity: 0,
                    transform: "translateY(8px)",   // 鼠标指针的偏移量：1 * margin
                }, {
                    opacity: 0.65,
                }, {
                    opacity: 1,
                    transform: "translateY(-8px)",
                }], {
                    duration: 200,
                    easing: "ease-out",
                    fill: "both",
                });
                mouseEventMetadata.animation.onfinish = e => {
                    if (e.currentTarget.playbackRate < 0) {
                        weiboCard.hidden = true;
                    }
                };
            }
            changeWeiboCardPosition();
        });
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === S_COMMAND_POINTER_EVENTS) {
            pointerEventsIndication.disabled = !pointerEventsIndication.disabled;
        }
        if (message.type === M_VIDEO_FRAME) {
            const videoRefs = document.querySelectorAll('video');
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
                    const dataurl = canvas.toDataURL("image/jpeg", 0.95);
                    sendResponse({dataurl: dataurl});
                } catch (e) {
                    chrome.runtime.sendMessage({type: S_WITHOUT_CORS_MODE});
                }
                break;
            }
        }
    });

    document.addEventListener("contextmenu", e => {
        if (pointerEventsIndication.parentElement && !pointerEventsIndication.disabled) {
            e.stopImmediatePropagation();
        }
    }, true);

    function onMouseOver(e) {
        if (e.altKey) return;
        if (e.target === weiboCard && e.relatedTarget === mouseEventMetadata.lastImgTarget) return;
        if (e.target === mouseEventMetadata.lastImgTarget && e.relatedTarget === weiboCard) return;

        mouseEventMetadata.lastOverTarget = e.target;
        if (e.target && e.target.tagName && e.target.tagName.toUpperCase() === "IMG") {
            const img = e.target;
            const reg = /^https?:\/\/.*\.sinaimg\.cn\//i;
            if (img.currentSrc && reg.test(img.currentSrc)) {
                mouseEventMetadata.lastImgTarget = img;
                clearTimeout(timers.mouseover);
                timers.mouseover = setTimeout(() => {
                    chrome.runtime.sendMessage({
                        type: S_REQUEST_USER_CARD,
                        url: img.currentSrc,
                    }, response => {
                        if (chrome.runtime.lastError) {
                            console.warn(chrome.runtime.lastError);
                            return;
                        }
                        if (response && response["data"] &&
                            mouseEventMetadata.lastOverTarget === img &&
                            mouseEventMetadata.lastOverTarget.parentElement) {
                            clearTimeout(timers.mouseout);
                            createWeiboCard(response);
                        }
                    });
                }, 150);
            }
        }
    }

    function onMouseOut(e) {
        if (e.altKey) return;
        if (e.target === mouseEventMetadata.lastImgTarget && e.relatedTarget === weiboCard) return;
        if (e.target === weiboCard && e.relatedTarget === mouseEventMetadata.lastImgTarget) return;

        if (e.target === weiboCard &&
            e.relatedTarget !== mouseEventMetadata.lastImgTarget ||
            e.target === mouseEventMetadata.lastImgTarget) {
            if (e.isTrusted) {
                mouseEventMetadata.lastImgTarget = null;
            }

            clearTimeout(timers.mouseout);
            timers.mouseout = setTimeout(() => {
                if (mouseEventMetadata.animation) {
                    mouseEventMetadata.animation.playbackRate = -1;
                }
            }, 250);
        }
    }

    function onMouseMove(e) {
        if (e.altKey) return;
        mouseEventMetadata.clientX = e.clientX;
        mouseEventMetadata.clientY = e.clientY;
        if (e.target === mouseEventMetadata.lastImgTarget) {
            changeWeiboCardPosition();
        }
    }

    function onDOMContentLoaded() {
        const highlight = document.createElement("x-highlight");
        const weiboCardStyle = document.createElement("link");
        const highlightStyleContent = `
            html {
                pointer-events: none !important;
            }
            iframe, embed, object, param, video, source {
                pointer-events: auto !important;
            }
            x-highlight[data-injector="${chrome.runtime.id}"] {
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
        const weiboCardStyleContent = `
            x-weibo-card[data-injector="${chrome.runtime.id}"][data-pending="true"] {
                display: none !important;
            }
            x-weibo-card[data-injector="${chrome.runtime.id}"] {
                position: fixed;
                top: 0;
                left: 0;
                transition: top ease-out 250ms, left ease-out 250ms;
                will-change: top, left, transition, opacity, transform;
                z-index: ${2 ** 24};
            }
        `;
        highlight.setAttribute("data-injector", chrome.runtime.id);
        weiboCardStyle.setAttribute("data-injector", chrome.runtime.id);

        /**
         * Resolve bug caused by `LeaVerou/prefixfree`
         * @see https://github.com/LeaVerou/prefixfree/issues/6131
         *
         * Problem pages are known:
         *  - http://howtoubuntu.org/things-to-do-after-installing-ubuntu-14-04-trusty-tahr#chrome
         */
        weiboCardStyle.setAttribute("data-noprefix", "no-conflict");
        pointerEventsIndication.setAttribute("data-noprefix", "no-conflict");

        weiboCardStyle.rel = "stylesheet";
        weiboCardStyle.href = `data:text/css;base64,${btoa(weiboCardStyleContent)}`;
        pointerEventsIndication.rel = "stylesheet";
        pointerEventsIndication.href = `data:text/css;base64,${btoa(highlightStyleContent)}`;
        pointerEventsIndication.disabled = true;

        if (document.head && document.body) {
            document.body.append(highlight);
            document.head.append(weiboCardStyle, pointerEventsIndication);
        } else {
            console.warn(`Injection failed.(Chrome Extension ID: ${chrome.runtime.id})`);
        }

        chrome.storage.sync.get(K_DISPLAY_USER_CARD, items => {
            if (!chrome.runtime.lastError) {
                if (items[K_DISPLAY_USER_CARD]) {
                    document.addEventListener("mouseover", onMouseOver, true);
                    document.addEventListener("mouseout", onMouseOut, true);
                    document.addEventListener("mousemove", onMouseMove, true);
                }
            }
        });
        chrome.storage.onChanged.addListener((changes, areaName) => {
            const targetChanges = changes[K_DISPLAY_USER_CARD];
            if (targetChanges && targetChanges.newValue != null) {
                if (targetChanges.newValue) {
                    document.addEventListener("mouseover", onMouseOver, true);
                    document.addEventListener("mouseout", onMouseOut, true);
                    document.addEventListener("mousemove", onMouseMove, true);
                } else {
                    document.removeEventListener("mouseover", onMouseOver, true);
                    document.removeEventListener("mouseout", onMouseOut, true);
                    document.removeEventListener("mousemove", onMouseMove, true);
                }
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onDOMContentLoaded, true);
    } else {
        onDOMContentLoaded();
    }

    document.addEventListener("keydown", e => {
        /**
         * @desc 按下ESC键关闭微博信息卡，但是保留 `lastImgTarget`，避免循环触发 mouseout 和 mouseover
         */
        if (e.key === "Escape" && weiboCard.parentElement && !weiboCard.hidden) {
            if (mouseEventMetadata.lastImgTarget) {
                e.preventDefault();
                e.stopPropagation();
                mouseEventMetadata.lastImgTarget.dispatchEvent(new MouseEvent("mouseout"));
            }
        }
    }, true);

}

bootloader(Date.now());
