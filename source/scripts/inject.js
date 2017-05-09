/**
 * Inject into Web Page
 */
const EventMap = new Set(["drop", "click", "paste"]);
const fileInput = document.createElement("input");

fileInput.type = "file";
fileInput.hidden = true;
fileInput.multiple = true;
fileInput.accept = Array.from(Weibo.chromeSupportedType).join(",");

const Resolve = (files, item, prefix, postfix) => {
    Weibo.readFile(files)
        .then(result => chrome.runtime.sendMessage({
            type: Weibo.transferId.fromBase64,
            item: item,
            result: result,
            prefix: prefix,
            postfix: postfix,
        }));
};

const EventRegister = {

    drop(item, prefix, postfix) {
        let target = document.querySelector(item.selector);
        if (target) {
            target.addEventListener("dragover", e => {
                e.preventDefault();
                e.stopPropagation();
            });
            target.addEventListener("drop", e => {
                e.preventDefault();
                e.stopPropagation();
                Resolve(e.dataTransfer.files, item, prefix, postfix);
            });
        }
    },

    click(item, prefix, postfix) {
        let target = document.querySelector(item.selector);
        if (target) {
            document.body.append(fileInput);
            fileInput.addEventListener("change", e => Resolve(e.target.files, item, prefix, postfix));
            target.addEventListener("click", e => {
                e.stopPropagation();
                fileInput.click();
            });
        }
    },

    paste(item, prefix, postfix) {
        let target = document.querySelector(item.selector);
        if (target) {
            target.addEventListener("paste", e => {
                e.stopPropagation();
                if (target.contains(e.target)) {
                    let items = e.clipboardData.items;
                    let buffer = [];
                    for (let item of items) {
                        if (item.kind === "file" && typeof item.getAsFile === "function") {
                            let file = item.getAsFile();
                            file && buffer.push(file);
                        }
                    }
                    Resolve(buffer, item, prefix, postfix);
                }
            });
        }
    },

};

chrome.runtime.onMessage.addListener(message => {
    try {
        if (message && message.type === Weibo.transferId.fromBackground && message.item.writeln !== "clipboard") {
            let target = document.querySelector(message.item.writeln || message.item.selector);
            if (target) {
                let start = target.selectionStart;
                let end = target.selectionEnd;
                let value = target.value;
                let prev = value.substring(0, start);
                let next = value.substring(end, value.length);
                target.value = prev + message.buffer.join("\n") + next;
            }
        }
    } catch (e) {}
});

self.addEventListener("message", e => {
    if (e.data && e.data.type === Weibo.transferId.fromUser && Array.isArray(e.data.note)) {
        for (let item of e.data.note) {
            if (item && EventMap.has(item.eventType)) {
                let prefix = String(e.data.prefix || "");
                let postfix = String(e.data.postfix || "");
                try {
                    EventRegister[item.eventType](item, prefix, postfix);
                } catch (e) {
                    console.warn("Event Register:", e.message);
                }
            }
        }
    }
});
