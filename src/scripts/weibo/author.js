/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {logger} from "../background/internal-logger.js";

const signedNid = Utils.randomString(16);
const iframeId = `iframe-${Utils.randomString(6)}`;

chrome.notifications.onClicked.addListener(notificationId => {
    if (notificationId === signedNid) {
        chrome.tabs.create({
            url: `http://weibo.com/login.php?url=${encodeURIComponent("http://weibo.com")}`,
        }, tab => chrome.notifications.clear(signedNid));
    }
});

/**
 * @param {boolean} notify
 * @return {Promise<{login: boolean}, void>}
 */
async function getUserStatus(notify) {
    return Utils
        .fetch(Utils.buildURL("http://weibo.com/aj/onoff/getstatus", {sid: 0}))
        .then(response => response.ok ? response.json() : Promise.reject(new Error(response.statusText)))
        .then(json => {
            if (json && json["code"] === "100000") {
                logger.add({
                    module: "getUserStatus",
                    message: "用户处于登录状态",
                });
                return {login: true};
            } else {
                notify && chrome.notifications.create(signedNid, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("notify_icon"),
                    title: chrome.i18n.getMessage("warn_title"),
                    message: "当前微博处于登出状态，请登录微博后再次尝试其他操作",
                    contextMessage: "单击转到微博的登录页面进行登录操作",
                    requireInteraction: true,
                });
                logger.add({
                    module: "getUserStatus",
                    message: "用户处于登出状态",
                }, logger.LEVEL.warn);
                return {login: false};
            }
        })
        .catch(reason => {
            notify && chrome.notifications.create(signedNid, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("warn_title"),
                message: "微博登录信息校验失败，请确认微博登录后再次尝试其他操作",
                contextMessage: "单击转到微博的登录页面进行登录操作",
                requireInteraction: true,
            });
            logger.add({
                module: "getUserStatus",
                message: reason,
                remark: "请求发生错误，假设用户处于登出状态，可能会导致实际的用户状态和获得的用户状态结果不一致",
            }, logger.LEVEL.error);
            return {login: false};
        });
}

/**
 * @desc Singleton
 * @param {boolean} notify
 * @return {Promise<{login: boolean}, void>}
 */
async function setUserStatus(notify) {
    return getUserStatus(false).then(json => {
        if (json.login) {
            logger.add({
                module: "setUserStatus",
                message: "检测到用户处于登录状态，中断激活用户登录状态的操作",
            }, logger.LEVEL.warn);
            return Promise.reject(json);
        } else {
            return Utils.fetch("http://weibo.com/aj/onoff/setstatus", {
                method: "POST",
                body: Utils.createSearchParams({sid: 0, state: 0}),
            }).then(response => {
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
                        logger.add({
                            module: "setUserStatus",
                            message: "用户可能处于未激活的登录状态，尝试激活",
                        });
                        return promise;
                    } else {
                        logger.add({
                            module: "setUserStatus",
                            message: "没有检测到重定向链接",
                            remark: "可能会导致实际的用户状态和获得的用户状态结果不一致",
                        }, logger.LEVEL.error);
                        return Promise.reject(new Error(response.url));
                    }
                } else {
                    logger.add({
                        module: "setUserStatus",
                        message: response.statusText,
                        remark: "可能会导致实际的用户状态和获得的用户状态结果不一致",
                    }, logger.LEVEL.warn);
                    return Promise.reject(new Error(response.statusText));
                }
            }).then(result => {
                return Promise.resolve(getUserStatus(notify));
            }).catch(reason => {
                return Promise.reject(getUserStatus(notify));
            });
        }
    });
}

const setUserStatusWithNotify = setUserStatus.bind(null, true);
const setUserStatusWithoutNotify = setUserStatus.bind(null, false);

/**
 * @package
 * @param {boolean} [notify=false]
 * @return {Promise<{login: boolean}, void>}
 */
export async function requestSignIn(notify = false) {
    if (notify) {
        return Utils.singleton(setUserStatusWithNotify);
    } else {
        return Utils.singleton(setUserStatusWithoutNotify);
    }
}

/**
 * @package
 * @return {Promise<{uid: string}, Error>}
 */
export async function requestUserId() {
    return Utils
        .fetch(Utils.buildURL("http://login.sina.com.cn/sso/prelogin.php", {entry: "weibo", __rnd: Date.now()}))
        .then(response => response.ok ? response.json() : Promise.reject(new Error(response.statusText)))
        .then(json => {
            if (json && json["retcode"] === 0 && json["uid"]) {
                logger.add({
                    module: "requestUserId",
                    message: "获取用户信息成功",
                });
                return {uid: json["uid"]};
            } else {
                logger.add({
                    module: "requestUserId",
                    message: "获取用户信息失败",
                    remark: "这种情况下无法命中缓存，没有其他影响",
                }, logger.LEVEL.warn);
                return Promise.reject(new Error("UserId not found"));
            }
        });
}
