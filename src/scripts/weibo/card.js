/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";

/**
 * @public
 * @param {string} uid
 * @return {Promise<Object, Error>}
 */
export async function requestUserCard(uid) {
    const url = `http://weibo.com/aj/v6/user/newcard?id=${uid}`;
    const pid = `CARD_${Utils.randomString(6)}_${Date.now()}`;
    const script = document.createElement("script");

    return new Promise((resolve, reject) => {
        function callback(json) {
            if (json && json["code"] === "100000" && json["data"]) {
                resolve(json);
            } else {
                reject(new Error("Invalid data"));
            }
        }
        self[pid] = callback;
        script.async = true;
        script.defer = true;
        script.src = url;
        document.body.append(script);
    }).finally(() => {
        script.remove();
        Reflect.deleteProperty(self, pid);
    });
}
