{

    const overrideStyle = document.createElement("link");

    Promise.all([
        import(chrome.runtime.getURL("scripts/base/utils.js")),
        import(chrome.runtime.getURL("scripts/base/register.js")),
        import(chrome.runtime.getURL("scripts/base/constant.js")),
        import(chrome.runtime.getURL("scripts/sharre/share-between-pages.js")),
    ]).then(([{Utils}, {
        chromeSupportedType,
        transferType,
    }, {MAXIMUM_EDGE}, {
        defaultPrefix,
        defaultSuffix,
        resolveBlobs,
    }]) => {
        const eventMap = new Set(["drop", "click", "paste"]);
        const fileInput = document.createElement("input");

        fileInput.type = "file";
        fileInput.hidden = true;
        fileInput.multiple = true;
        fileInput.accept = Array.from(chromeSupportedType).join(",");

        class EventRegister {

            static drop(item, prefix, suffix) {
                const target = document.querySelector(item.selector);
                if (target) {
                    target.addEventListener("dragover", e => {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                    target.addEventListener("drop", e => {
                        e.preventDefault();
                        e.stopPropagation();
                        resolveBlobs(e.dataTransfer.files, item, prefix, suffix);
                    });
                }
            }

            static click(item, prefix, suffix) {
                const target = document.querySelector(item.selector);
                if (target) {
                    document.body.append(fileInput);
                    fileInput.addEventListener("change", e => resolveBlobs(e.target.files, item, prefix, suffix));
                    target.addEventListener("click", e => {
                        e.stopPropagation();
                        fileInput.click();
                    });
                }
            }

            static paste(item, prefix, suffix) {
                const target = document.querySelector(item.selector);
                if (target) {
                    target.addEventListener("paste", e => {
                        e.stopPropagation();
                        if (target.contains(e.target)) {
                            const items = e.clipboardData.items;
                            const buffer = [];
                            for (const item of items) {
                                if (item.kind === "file" && typeof item.getAsFile === "function") {
                                    const file = item.getAsFile();
                                    file && buffer.push(file);
                                }
                            }
                            resolveBlobs(buffer, item, prefix, suffix);
                        }
                    });
                }
            }

        }

        chrome.runtime.onMessage.addListener(message => {
            try {
                if (message.type === transferType.fromBackground && message.item.writeln !== "clipboard") {
                    const target = document.querySelector(message.item.writeln || message.item.selector);
                    if (target) {
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const value = target.value;
                        const prev = value.substring(0, start);
                        const next = value.substring(end, value.length);
                        target.value = prev + message.buffer.join("\n") + next;
                    }
                }
                if (message.type === transferType.fromVideoFrame && message.srcUrl) {
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
                            canvas.toBlob(blob => resolveBlobs([blob], {
                                writeln: "clipboard",
                            }, defaultPrefix, defaultSuffix), "image/jpeg", 0.95);
                        } catch (e) {
                            chrome.runtime.sendMessage({
                                type: transferType.fromWithoutCORSMode,
                            });
                        }
                        break;
                    }
                }
                if (message.type === transferType.fromImageFrame && message.srcUrl) {
                    Utils.fetch(message.srcUrl, {
                        cache: "default",
                        credentials: "omit",
                    }).then(response => {
                        return response.ok ? response.blob() : Promise.reject(response.status);
                    }).then(blob => {
                        resolveBlobs([blob], {
                            writeln: "clipboard",
                        }, defaultPrefix, defaultSuffix);
                    }).catch(reason => {
                        chrome.runtime.sendMessage({
                            type: transferType.fromFetchFileFailed,
                        });
                    });
                }
                if (message.type === transferType.fromChromeCommand) {
                    overrideStyle.disabled = !overrideStyle.disabled;
                }
            } catch (e) {
                console.warn(e.message);
            }
        });

        self.addEventListener("message", e => {
            if (e.data && e.data.type === transferType.fromUser && Array.isArray(e.data.note)) {
                for (const item of e.data.note) {
                    if (item && eventMap.has(item.eventType)) {
                        const prefix = String(e.data.prefix || "");
                        const suffix = String(e.data.suffix || "");
                        try {
                            EventRegister[item.eventType](item, prefix, suffix);
                        } catch (e) {
                            console.warn("Event Register:", e.message);
                        }
                    }
                }
            }
        });

        self.addEventListener("contextmenu", e => {
            if (!overrideStyle.disabled) {
                e.stopImmediatePropagation();
            }
        }, true);
    });


    self.addEventListener("DOMContentLoaded", e => {
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
    }, true);

}
