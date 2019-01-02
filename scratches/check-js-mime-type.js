/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc Hard code
 * @desc Independent file
 * @desc Check JavaScript mime-type on Windows platform
 * @desc Can be removed at any time
 *
 * @desc Backup
 * @desc Chrome 64/65
 * @desc Important: replace invalid url with others
 */
chrome.runtime.getPlatformInfo(platformInfo => {
    if (platformInfo.os !== "win") return;

    // @see https://mimesniff.spec.whatwg.org/#javascript-mime-type
    const validMimeTypes = new Set([
        "application/ecmascript",
        "application/javascript",
        "application/x-ecmascript",
        "application/x-javascript",
        "text/ecmascript",
        "text/javascript",
        "text/javascript1.0",
        "text/javascript1.1",
        "text/javascript1.2",
        "text/javascript1.3",
        "text/javascript1.4",
        "text/javascript1.5",
        "text/jscript",
        "text/livescript",
        "text/x-ecmascript",
        "text/x-javascript",
    ]);

    self.fetch(chrome.runtime.getURL("scripts/checker.js"), {
        cache: "default",
    })
        .then(response => {
            if (response.ok && response.headers) {
                const scriptMimeType = response.headers.get("content-type");
                if (validMimeTypes.has(scriptMimeType)) {
                    console.log("JavaScript mime-type:", scriptMimeType);
                } else if (scriptMimeType) {
                    console.warn("JavaScript mime-type:", scriptMimeType);
                    chrome.notifications.create(
                        {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notification_icon"),
                            title: chrome.i18n.getMessage("fail_title"),
                            message: chrome.i18n.getMessage("js_content_type_amendment"),
                            contextMessage: chrome.i18n.getMessage("js_content_type_exception"),
                            priority: 1,
                            buttons: [
                                { title: chrome.i18n.getMessage("js_content_type_download_amendment_file") },
                                { title: chrome.i18n.getMessage("restart_extension_self") },
                            ],
                            requireInteraction: true,
                        },
                        notificationId => {
                            const buttonClicked = (notifyId, buttonIndex) => {
                                if (notifyId === notificationId) {
                                    if (buttonIndex === 0) {
                                        chrome.downloads.download({
                                            url: chrome.runtime.getURL(
                                                "assets/regedit/reset-javascript-content-type.reg",
                                            ),
                                        });
                                    }
                                    if (buttonIndex === 1) {
                                        chrome.notifications.clear(notificationId, wasCleared =>
                                            chrome.runtime.reload(),
                                        );
                                    }
                                }
                            };
                            const destroyAllListeners = notifyId => {
                                if (notifyId === notificationId) {
                                    chrome.notifications.onButtonClicked.removeListener(buttonClicked);
                                    chrome.notifications.onClosed.removeListener(destroyAllListeners);
                                }
                            };
                            chrome.notifications.onButtonClicked.addListener(buttonClicked);
                            chrome.notifications.onClosed.addListener(destroyAllListeners);
                        },
                    );
                } else {
                    console.warn("Cannot found Content-Type in response.headers");
                }
            } else {
                console.warn("Invalid response.code or response.headers");
            }
        })
        .catch(reason => {
            console.warn(reason);
        });
});
