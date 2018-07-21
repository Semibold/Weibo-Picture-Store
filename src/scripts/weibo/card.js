/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {USER_CARD_CACHE, USER_CARD_EXPIRED} from "../sharre/constant.js";

/**
 * @public
 * @param {string} uid
 * @return {Promise<Object, Error>}
 */
export async function requestUserCard(uid) {
    if (USER_CARD_CACHE.has(uid)) {
        const cached = USER_CARD_CACHE.get(uid);
        if (Date.now() - cached.timestamp < USER_CARD_EXPIRED) {
            return cached.data;
        } else {
            USER_CARD_CACHE.delete(uid);
        }
    } else {
        for (const [uid, cached] of USER_CARD_CACHE) {
            if (Date.now() - cached.timestamp > USER_CARD_CACHE) {
                USER_CARD_CACHE.delete(uid);
            } else {
                break;
            }
        }
    }

    const pid = `CARD_${Utils.randomString(6)}_${Date.now()}`;
    const url = `https://weibo.com/aj/v6/user/newcard?id=${uid}&callback=${pid}`;
    const script = document.createElement("script");

    return new Promise((resolve, reject) => {
        function callback(json) {
            if (json && json["code"] === "100000" && json["data"]) {
                USER_CARD_CACHE.set(uid, {
                    uid: uid,
                    data: json,
                    timestamp: Date.now(),
                });
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
