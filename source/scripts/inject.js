const EventMap = new Set(["drop", "click", "paste"]);
const fileInput = document.createElement("input");
const overrideStyle = document.createElement("style");

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

const EventRegister = {

    drop(item, prefix, suffix) {
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
    },

    click(item, prefix, suffix) {
        const target = document.querySelector(item.selector);
        if (target) {
            document.body.append(fileInput);
            fileInput.addEventListener("change", e => resolveBlobs(e.target.files, item, prefix, suffix));
            target.addEventListener("click", e => {
                e.stopPropagation();
                fileInput.click();
            });
        }
    },

    paste(item, prefix, suffix) {
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
    },

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
                if (videoRef.src !== message.srcUrl) {
                    continue;
                }
                const MAX_EDGE = 2 ** 15 - 1;
                const width = Math.ceil(videoRef.videoWidth);
                const height = Math.ceil(videoRef.videoHeight);
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const prefix = "https://ws1.sinaimg.cn/large/";
                const suffix = "";
                if (width < MAX_EDGE && height < MAX_EDGE) {
                    canvas.width = width;
                    canvas.height = height;
                    context.drawImage(videoRef, 0, 0, width, height);
                    canvas.toBlob(blob => resolveBlobs([blob], {
                        writeln: "clipboard",
                    }, prefix, suffix), "image/jpeg", 0.95);
                }
                break;
            }
        }
    } catch (e) {
        console.warn(e.message);
    }
});

self.addEventListener("message", e => {
    if (e.data && e.data.type === Weibo.transferType.fromUser && Array.isArray(e.data.note)) {
        for (const item of e.data.note) {
            if (item && EventMap.has(item.eventType)) {
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
    document.head.append(overrideStyle);
    overrideStyle.textContent = `* { pointer-events: none !important; } video, iframe { pointer-events: auto !important; }`;
    overrideStyle.disabled = true;
});

self.addEventListener("contextmenu", e => {
    if (e.ctrlKey) {
        e.stopImmediatePropagation();
        overrideStyle.disabled = false;

        // Restore `disabled` property of style before the next repaint.
        // Should not listen `keyup` event which will not trigger if native context menu is activated.
        requestAnimationFrame(() => {
            overrideStyle.disabled = true;
        });
    }
}, true);
