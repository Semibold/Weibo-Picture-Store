const eventMap = new Set(["drop", "click", "paste"]);
const fileInput = document.createElement("input");
const overrideStyle = document.createElement("link");

fileInput.type = "file";
fileInput.hidden = true;
fileInput.multiple = true;
fileInput.accept = Array.from(Weibo.chromeSupportedType).join(",");

const resolveBlobs = (blobs, item, prefix, suffix) => {
    Weibo.readFile(blobs)
        .then(result => chrome.runtime.sendMessage({
            type: Weibo.transferType.fromBase64,
            item: item,
            result: result,
            prefix: prefix,
            suffix: suffix,
        }));
};

const EventRegister = class {

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

};

chrome.runtime.onMessage.addListener(message => {
    try {
        if (message.type === Weibo.transferType.fromBackground && message.item.writeln !== "clipboard") {
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
        if (message.type === Weibo.transferType.fromVideoFrame && message.srcUrl) {
            const videoRefs = document.querySelectorAll('video');
            for (const videoRef of videoRefs) {
                if (videoRef.currentSrc !== message.srcUrl) {
                    continue;
                }
                const MAX_EDGE = 2 ** 15 - 1;
                const width = Math.ceil(videoRef.videoWidth);
                const height = Math.ceil(videoRef.videoHeight);
                if (width === 0 || height === 0) {
                    return;
                }
                if (width > MAX_EDGE || height > MAX_EDGE) {
                    return;
                }
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const prefix = "https://ws1.sinaimg.cn/large/";
                const suffix = "";
                canvas.width = width;
                canvas.height = height;
                context.drawImage(videoRef, 0, 0, width, height);
                try {
                    canvas.toBlob(blob => resolveBlobs([blob], {
                        writeln: "clipboard",
                    }, prefix, suffix), "image/jpeg", 0.95);
                } catch (e) {
                    chrome.runtime.sendMessage({
                        type: Weibo.transferType.fromWithoutCORSMode,
                    });
                }
                break;
            }
        }
        if (message.type === Weibo.transferType.fromChromeCommand) {
            overrideStyle.disabled = !overrideStyle.disabled;
        }
    } catch (e) {
        console.warn(e.message);
    }
});

self.addEventListener("message", e => {
    if (e.data && e.data.type === Weibo.transferType.fromUser && Array.isArray(e.data.note)) {
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

self.addEventListener("contextmenu", e => {
    if (!overrideStyle.disabled) {
        e.stopImmediatePropagation();
    }
}, true);
