/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {Channel} from "./channel.js";
import {pidUpload} from "./pid-upload.js";
import {setStatus} from "./set-status.js";

const url = "http://picupload.weibo.com/interface/pic_upload.php";
const failId = Utils.randomString(16);

/**
 * @async
 * @return {Promise<item>}
 */
export async function fileUpload(item, replay) {
    const oneline = Channel[item.readType];
    const method = "POST";
    const body = oneline.body(item.result);
    const param = oneline.param({mime: item.mime.type});

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
                return Object.assign(item, {
                    fid: pid + item.mime.suffix,
                });
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
                    return fileUpload(item, true);
                }
            }).catch(reason => {
                reason.login && chrome.notifications.create(failId, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("notify_icon"),
                    title: chrome.i18n.getMessage("fail_title"),
                    message: "微博登录信息校验成功，可是。。。图片上传失败了呢",
                });
            });
        }
    });
}
