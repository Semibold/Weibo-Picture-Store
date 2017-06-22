const notifyId = Utils.randomString(16);
const popupState = new Map();

const resolveReferrer = (srcUrl, pageUrl) => {
    const refererHandler = details => {
        const name = "Referer";
        const value = pageUrl;

        for (let i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name.toLowerCase() === name.toLowerCase()) {
                details.requestHeaders.splice(i, 1);
                break;
            }
        }

        details.requestHeaders.push({name, value});
        return {requestHeaders: details.requestHeaders};
    };

    return {
        addListener: () => {
            if (!chrome.webRequest.onBeforeSendHeaders.hasListener(refererHandler)) {
                chrome.webRequest.onBeforeSendHeaders.addListener(refererHandler, {
                    urls: [srcUrl],
                }, ["requestHeaders", "blocking"]);
            }
        },
        removeListener: () => {
            if (chrome.webRequest.onBeforeSendHeaders.hasListener(refererHandler)) {
                chrome.webRequest.onBeforeSendHeaders.removeListener(refererHandler);
            }
        },
    };
};


chrome.browserAction.onClicked.addListener(tab => {
    if (!popupState.get("locked")) {
        if (!popupState.has("id")) {
            const width = 860;
            const height = 600;
            const top = Math.floor(screen.availHeight / 2 - height / 2);
            const left = Math.floor(screen.availWidth / 2 - width / 2);

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


chrome.windows.onRemoved.addListener(windowId => {
    windowId === popupState.get("id") && popupState.delete("id");
});


chrome.contextMenus.create({
    title: chrome.i18n.getMessage("manage_history_record"),
    contexts: ["browser_action"],
    onclick: (obj, tab) => {
        chrome.tabs.create({url: "history.html"});
    },
});


chrome.contextMenus.create({
    title: chrome.i18n.getMessage("upload_image_to_micro_album"),
    contexts: ["image"],
    onclick: (obj, tab) => {
        let controller = null;
        if (Utils.isValidURL(obj.srcUrl) && Utils.isValidURL(obj.pageUrl)) {
            controller = resolveReferrer(obj.srcUrl, obj.pageUrl);
            controller.addListener();
        }
        Weibo.fetchBlob(obj.srcUrl)
            .then(result => {
                controller && controller.removeListener();
                return Promise.resolve(result);
            })
            .catch(reason => {
                controller && controller.removeListener();
                return Promise.reject(reason);
            })
            .then(blob => Weibo.readFile([blob]))
            .then(result => Weibo.filePurity(result))
            .then(result => Weibo.fileUpload(result))
            .then(result => {
                if (result[0]) {
                    const item = result[0];
                    const url = `https://${Weibo.urlPrefix[0] + Weibo.rootZone}/large/${item.pid + Weibo.acceptType[item.mimeType].typo}`;
                    Utils.writeToClipboard(url, () => {
                        chrome.notifications.create(notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("write_to_clipboard"),
                            contextMessage: chrome.i18n.getMessage("write_to_clipboard_hinter"),
                        });
                    });
                }
            })
            .catch(Utils.noop);
    },
});


chrome.runtime.onMessage.addListener((message, sender) => {
    if (message && message.type === Weibo.transferType.fromBase64) {
        Weibo.filePurity(message.result)
            .then(result => Weibo.fileUpload(result))
            .then(result => {
                const buffer = [];
                for (const item of result) {
                    item.url = `${message.prefix + item.pid + Weibo.acceptType[item.mimeType].typo + message.suffix}`;
                    buffer.push(item.url);
                }
                if (message.item.writeln === "clipboard") {
                    const text = buffer.join("\n");
                    Utils.writeToClipboard(text, () => {
                        text && chrome.notifications.create(notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("write_to_clipboard"),
                            contextMessage: chrome.i18n.getMessage("write_to_clipboard_hinter"),
                        });
                    })
                }
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: Weibo.transferType.fromBackground,
                    item: message.item,
                    buffer: buffer,
                    result: result,
                    prefix: message.prefix,
                    suffix: message.suffix,
                });
            });
    }
});


chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    const name = "Referer";
    const value = "http://photo.weibo.com/";

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
