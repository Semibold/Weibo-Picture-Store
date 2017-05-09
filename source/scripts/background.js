/**
 * chrome background file
 */
const notifyId = Utils.randomString(16);
const popupState = new Map();


chrome.browserAction.onClicked.addListener(tab => {
    if (!popupState.get("locked")) {
        if (!popupState.has("id")) {
            let width = 860;
            let height = 600;
            let top = Math.floor(screen.availHeight / 2 - height / 2);
            let left = Math.floor(screen.availWidth / 2 - width / 2);

            popupState.set("locked", true);
            chrome.windows.create({
                top,
                left,
                width,
                height,
                focused: true,
                incognito: false,
                type: "popup",
                url: "popup.html",
            }, result => {
                popupState.set("id", result.id);
                popupState.set("locked", false);
            });
        } else {
            chrome.windows.update(popupState.get("id"), {drawAttention: true});
        }
    }
});


chrome.runtime.onInstalled.addListener(details => chrome.tabs.create({url: "recorder.html#changelog"}));
chrome.windows.onRemoved.addListener(windowId => {
    windowId === popupState.get("id") && popupState.delete("id");
});


chrome.contextMenus.create({
    title: chrome.i18n.getMessage("upload_image_url"),
    contexts: ["image"],
    onclick: (obj, tab) => {
        Weibo.fetchBlob(obj.srcUrl)
            .then(blob => Weibo.readFile([blob]))
            .then(result => Weibo.filePurity(result))
            .then(result => Weibo.fileUpload(result))
            .then(result => {
                if (result[0]) {
                    let item = result[0];
                    let url = `https://${Weibo.urlPrefix[0] + Weibo.rootZone}/large/${item.pid + Weibo.acceptType[item.file.type].typo}`;
                    Utils.writeToClipboard(url, () => {
                        chrome.notifications.create(notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("copy_to_clipboard"),
                            contextMessage: chrome.i18n.getMessage("copy_to_clipboard_hinter"),
                        });
                    });
                }
            });
    },
}, () => chrome.runtime.lastError && console.warn(chrome.runtime.lastError));


chrome.runtime.onMessage.addListener((message, sender) => {
    if (message && message.type === Weibo.transferId.fromBase64) {
        Weibo.filePurity(message.result)
            .then(result => Weibo.fileUpload(result))
            .then(result => {
                let buffer = [];
                for (let item of result) {
                    item.url = `${message.prefix + item.pid + Weibo.acceptType[item.file.type].typo + message.postfix}`;
                    buffer.push(item.url);
                }
                if (message.item.writeln === "clipboard") {
                    let text = buffer.join("\n");
                    Utils.writeToClipboard(text, () => {
                        text && chrome.notifications.create(notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("copy_to_clipboard"),
                            contextMessage: chrome.i18n.getMessage("copy_to_clipboard_hinter"),
                        });
                    })
                }
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: Weibo.transferId.fromBackground,
                    item: message.item,
                    buffer: buffer,
                    result: result,
                    prefix: message.prefix,
                    postfix: message.postfix,
                });
            });
    }
});


chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    let name = "Referer";
    let value = "http://photo.weibo.com/";

    for (let i = 0; i < details.requestHeaders.length; i++) {
        if (details.requestHeaders[i].name.toLowerCase() === name.toLowerCase()) {
            details.requestHeaders.splice(i, 1);
            break;
        }
    }

    details.requestHeaders.push({name, value});
    return {requestHeaders: details.requestHeaders};
}, {
    urls: ["http://photo.weibo.com/*"],
}, ["requestHeaders", "blocking"]);
