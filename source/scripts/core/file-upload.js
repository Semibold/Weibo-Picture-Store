/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {TYPE_UPLOAD} from "../base/constant.js";
import {Utils} from "../base/utils.js";
import {Channel} from "../base/channel.js";
import {fileProgress} from "./file-progress.js";
import {pidUpload} from "./pid-upload.js";
import {setStatus} from "./set-status.js";

const url = "http://picupload.service.weibo.com/interface/pic_upload.php";
const failId = Utils.randomString(16);
const tailer = {promise: Promise.resolve()};

export const fileUpload = (list, endCallback) => {
    const buffer = [];
    const progress = fileProgress(TYPE_UPLOAD);
    const requestUpload = (item, replay) => {
        const oneline = Channel[item.readType];
        const method = "POST";
        const body = oneline.body(item.result);
        const param = oneline.param({mime: item.mimeType});

        return Utils.fetch(Utils.buildURL(url, param), {method, body}).then(response => {
            return response.ok ? response.text() : Promise.reject(response.status);
        }).then(text => {
            if (text) {
                const tree = new DOMParser().parseFromString(text, "text/xml");
                const data = tree.querySelector("data").textContent;
                const pid = tree.querySelector("pic_1 > pid").textContent;
                const size = tree.querySelector("pic_1 > size").textContent;
                const width = tree.querySelector("pic_1 > width").textContent;
                const height = tree.querySelector("pic_1 > height").textContent;

                if (pid) {
                    try {
                        const uid = JSON.parse(atob(data)).uid.toString();
                        pidUpload(pid, uid);
                    } catch (e) {
                        console.warn(e.message);
                        pidUpload(pid);
                    }
                    return Object.assign(item, {pid, size, width, height});
                } else {
                    return Promise.reject("Invalid Data");
                }
            } else {
                return Promise.reject("Invalid Data");
            }
        }).catch(reason => {
            if (!replay) {
                return setStatus().then(json => {
                    if (json.login) {
                        return requestUpload(item, true);
                    }
                }).catch(reason => {
                    reason.login && chrome.notifications.create(failId, {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("notification_icon"),
                        title: chrome.i18n.getMessage("fail_title"),
                        message: chrome.i18n.getMessage("upload_file_failed"),
                    });
                });
            }
        });
    };

    progress.padding(list.length);
    progress.triggerProgress();

    tailer.promise = list.reduce((accumulator, currentValue) => {
        return accumulator.then(result => {
            return requestUpload(currentValue);
        }).then(item => {
            if (item) {
                buffer.push(item);
            }
            progress.consume();
            typeof endCallback === "function" && endCallback(item);
            return Promise.resolve(item);
        });
    }, tailer.promise);

    return tailer.promise.then(result => buffer);
};
Utils.sharre(fileUpload);
