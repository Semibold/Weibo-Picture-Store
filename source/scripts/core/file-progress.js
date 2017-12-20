/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * WARN: `requestAnimationFrame` has no effect on chrome background page
 */
import {TYPE_UPLOAD, TYPE_DOWNLOAD} from "../base/constant.js";
import {Utils} from "../base/utils.js";

const fps = 25;
const storeMap = new Map();
const nextFrame = callback => setTimeout(callback, 1000 / fps);

const triggerProgress = (tid) => {
    let dtd = storeMap.get(tid);
    let avr = 3;
    let max = 0.9;
    let sec = avr * dtd.total;
    let bio = sec * fps;
    let gap = 100 / dtd.total;
    let step = gap * max / sec / fps;
    let time = 0;
    let message = "";
    let contextMessage = "";

    if (dtd.settle === dtd.total) {
        return false;
    }

    switch (tid) {
        case TYPE_UPLOAD:
            message = chrome.i18n.getMessage("upload_progress_message");
            contextMessage = chrome.i18n.getMessage("upload_progress_hinter");
            break;
        case TYPE_DOWNLOAD:
            message = chrome.i18n.getMessage("download_progress_message");
            contextMessage = chrome.i18n.getMessage("download_progress_hinter");
            break;
        default:
            return false;
    }

    let loop = () => {
        let next = Math.floor(dtd.settle * gap + (dtd.total - dtd.settle) * time * step);

        if (next < 10) next = 10;
        if (next > 100) next = 100;

        time >= bio ? time = bio : time++;

        chrome.notifications.create(dtd.notifyId, {
            type: "progress",
            iconUrl: chrome.i18n.getMessage("notification_icon"),
            title: chrome.i18n.getMessage("info_title"),
            message: message,
            contextMessage: contextMessage,
            progress: next,
            requireInteraction: true,
        }, notificationId => {
            if (dtd.settle === dtd.total) {
                dtd.requestId && clearTimeout(dtd.requestId);
                dtd.reformat();
                chrome.notifications.clear(notificationId, wasCleared => {
                    if (wasCleared && tid === TYPE_UPLOAD) {
                        chrome.notifications.create(dtd.notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("notification_icon"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("upload_workflow_ended"),
                        });
                    }
                });
            }
        });

        dtd.requestId = nextFrame(loop);
    };

    dtd.requestId && clearTimeout(dtd.requestId);
    dtd.requestId = nextFrame(loop);
    return true;
};

class TypeEntry {

    constructor() {
        this.notifyId = Utils.randomString(16);
        this.requestId = null;
        this.total = 0;
        this.settle = 0;
    }

    reformat() {
        this.total = 0;
        this.settle = 0;
    }

    consume() {
        if (this.settle < this.total) {
            this.settle++;
        }
    }

    padding(n) {
        if (Number.isInteger(n) && n > 0) {
            this.total += n;
        }
    }

}

export const fileProgress = (tid) => {
    const dtd = storeMap.get(tid);
    return {
        consume() {
            return dtd.consume();
        },
        padding(n) {
            return dtd.padding(n);
        },
        triggerProgress() {
            return triggerProgress(tid);
        },
    };
};

storeMap.set(TYPE_UPLOAD, new TypeEntry());
storeMap.set(TYPE_DOWNLOAD, new TypeEntry());
Utils.sharre(fileProgress);
