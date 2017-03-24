/**
 * chrome background file
 */
const notifyId = Utils.randomString(16);
const popupState = {id: null, locked: false};


chrome.browserAction.onClicked.addListener(tab => {
    if (!popupState.locked) {
        if (popupState.id == null) {
            let width = 860;
            let height = 600;
            let top = Math.floor(screen.availHeight / 2 - height / 2);
            let left = Math.floor(screen.availWidth / 2 - width / 2);

            popupState.locked = true;
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
                popupState.id = result.id;
                popupState.locked = false;
            });
        } else {
            chrome.windows.update(popupState.id, {drawAttention: true});
        }
    }
});

chrome.windows.onRemoved.addListener(windowId => {
    if (windowId === popupState.id) popupState.id = null;
});


const uploadMenuEntryId = chrome.contextMenus.create({
    contexts: ["image"],
    title: chrome.i18n.getMessage("copy_image_url"),
    onclick: (obj, tab) => {
        if (Utils.checkImageURL(obj.srcUrl, true)) {
            Utils.fetchImage(obj.srcUrl)
                .then(blob => Weibo.readFile([blob]))
                .then(result => Weibo.fileUpload(result))
                .then(result => result[0] && transformRaw(result[0]))
                .catch(reason => {
                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("64"),
                        title: chrome.i18n.getMessage("warn_title"),
                        message: chrome.i18n.getMessage("get_image_url_fail"),
                    });
                });
        } else {
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("info_title"),
                message: chrome.i18n.getMessage("image_type_mismatch"),
            });
        }
    },
}, () => chrome.runtime.lastError && console.warn(chrome.runtime.lastError));

const transformRaw = raw => {
    let url = `https://${Weibo.urlPrefix[0] + Weibo.rootZone}/large/${raw.pid + Weibo.acceptType[raw.fileType].typo}`;
    let span = document.createElement("span");
    let spanRange = document.createRange();
    let selection = document.getSelection();

    span.textContent = url;
    document.body.append(span);
    spanRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(spanRange);
    document.execCommand("copy");
    span.remove();
    chrome.notifications.create(notifyId, {
        type: "basic",
        iconUrl: chrome.i18n.getMessage("64"),
        title: chrome.i18n.getMessage("info_title"),
        message: chrome.i18n.getMessage("copy_to_clipboard"),
        contextMessage: chrome.i18n.getMessage("copy_to_clipboard_hinter"),
    });
};


chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    const name = "Referer";
    const value = "http://photo.weibo.com/";

    for (let i = 0; i < details.requestHeaders.length; i++) {
        if (details.requestHeaders[i].name.toLowerCase() === name.toLowerCase()) {
            details.requestHeaders.splice(i, 1);
            break;
        }
    }

    details.requestHeaders.push({
        name,
        value,
    });

    return {
        requestHeaders: details.requestHeaders,
    };
}, {
    urls: ["http://photo.weibo.com/*"],
}, ["requestHeaders", "blocking"]);
