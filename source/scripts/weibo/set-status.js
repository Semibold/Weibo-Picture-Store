/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {getStatus} from "./get-status.js";
import {weiboSingleton} from "./channel.js";

const doneCode = "100000";
const iframeId = `iframe-${Utils.randomString(6)}`;
const url = "http://weibo.com/aj/onoff/setstatus";

async function setStatusRequest() {
    const method = "POST";
    const body = Utils.createSearchParams({sid: 0, state: 0});
    return getStatus().then(json => {
        if (json.login) {
            return Promise.reject(json);
        } else {
            return Utils.fetch(url, {method, body}).then(response => {
                if (response.ok) {
                    if (response.redirected) {
                        const iframe = document.getElementById(iframeId) || document.createElement("iframe");
                        const promise = new Promise((resolve, reject) => {
                            iframe.onload = e => {
                                resolve();
                                iframe.onload = null;
                                iframe.onerror = null;
                                iframe.remove();
                            };
                            iframe.onerror = e => { // Useless
                                reject();
                                iframe.onload = null;
                                iframe.onerror = null;
                                iframe.remove();
                            };
                        });
                        iframe.id = iframeId;
                        iframe.src = response.url;
                        document.body.append(iframe);
                        return promise;
                    } else {
                        return Promise.reject(response.redirected);
                    }
                } else {
                    return Promise.reject(response.status);
                }
            }).then(result => {
                return Promise.resolve(getStatus(true));
            }).catch(reason => {
                return Promise.reject(getStatus(true));
            });
        }
    });
}

/**
 * @async
 * @return {Promise<{login: boolean}>}
 */
export async function setStatus() {
    return weiboSingleton(setStatusRequest);
}
