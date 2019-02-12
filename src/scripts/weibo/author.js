/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { Log } from "../sharre/log.js";
import { weiboMap } from "../background/persist-store.js";
import { singleton } from "./banker.js";
import {
    E_CANT_TRANSIT_REGEXP,
    E_INVALID_PARSED_DATA,
    E_MISS_WEIBO_ACCOUNT,
    E_MISS_WEIBO_USER_ID,
    NID_REMAIN_LOGOUT,
    NID_SIGNIN_RESULT,
} from "../sharre/constant.js";

const iframeId = `iframe-${Utils.randomString(6)}`;

/**
 * @param {boolean} notify
 * @return {Promise<{login: boolean}>}
 * @no-reject
 */
async function getUserStatus(notify) {
    return Utils.fetch(Utils.buildURL("http://weibo.com/aj/onoff/getstatus", { sid: 0 }))
        .then(response => response.json())
        .then(json => {
            if (json && json["code"] === "100000") {
                Log.d({
                    module: "getUserStatus",
                    message: "用户处于登录状态",
                });
                return { login: true };
            } else {
                notify &&
                    chrome.notifications.create(NID_REMAIN_LOGOUT, {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("notify_icon"),
                        title: chrome.i18n.getMessage("warn_title"),
                        message: "当前微博处于登出状态，请登录微博后再次尝试其他操作",
                        contextMessage: "单击转到微博的登录页面进行登录操作",
                        requireInteraction: true,
                    });
                Log.w({
                    module: "getUserStatus",
                    message: "用户处于登出状态",
                });
                return { login: false };
            }
        })
        .catch(reason => {
            notify &&
                chrome.notifications.create(NID_REMAIN_LOGOUT, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("notify_icon"),
                    title: chrome.i18n.getMessage("warn_title"),
                    message: "微博登录信息校验失败，请确认微博登录后再次尝试其他操作",
                    contextMessage: "单击转到微博的登录页面进行登录操作",
                    requireInteraction: true,
                });
            Log.e({
                module: "getUserStatus",
                message: reason,
                remark: "请求发生错误，假设用户处于登出状态，可能会导致实际的用户状态和获得的用户状态结果不一致",
            });
            return { login: false };
        });
}

/**
 * Singleton
 *
 * @param {boolean} notify
 * @return {Promise<{login: boolean}>}
 * @reject {Promise<{login: boolean}>}
 */
async function setUserStatus(notify) {
    return getUserStatus(false).then(json => {
        if (json.login) {
            Log.w({
                module: "setUserStatus",
                message: "检测到用户处于登录状态，中断激活用户登录状态的操作",
            });
            return Promise.reject(json);
        } else {
            if (weiboMap.get("allowUserAccount")) {
                const username = weiboMap.get("username");
                const password = weiboMap.get("password");
                return signInByUserAccount(username, password)
                    .catch(reason => {
                        notify &&
                            chrome.notifications.create(NID_SIGNIN_RESULT, {
                                type: "basic",
                                iconUrl: chrome.i18n.getMessage("notify_icon"),
                                title: chrome.i18n.getMessage("fail_title"),
                                message: "登录失败，请检查选项中的微博账户及密码是否正确",
                                contextMessage: (reason && reason.message) || "未知错误",
                            });
                        return Promise.reject(reason);
                    })
                    .then(result => Promise.resolve(getUserStatus(notify)))
                    .catch(reason => Promise.reject(getUserStatus(notify)));
            }
            return Utils.fetch("http://weibo.com/aj/onoff/setstatus", {
                method: "POST",
                body: Utils.createSearchParams({ sid: 0, state: 0 }),
            })
                .then(response => {
                    if (response.redirected) {
                        const iframe = document.getElementById(iframeId) || document.createElement("iframe");
                        const promise = new Promise((resolve, reject) => {
                            iframe.onload = e => {
                                resolve();
                                iframe.onload = null;
                                iframe.onerror = null;
                                iframe.remove();
                            };
                            // Useless
                            iframe.onerror = e => {
                                reject();
                                iframe.onload = null;
                                iframe.onerror = null;
                                iframe.remove();
                            };
                        });
                        iframe.id = iframeId;
                        iframe.src = response.url;
                        document.body.append(iframe);
                        Log.d({
                            module: "setUserStatus",
                            message: "用户可能处于未激活的登录状态，尝试激活",
                        });
                        return promise;
                    } else {
                        Log.e({
                            module: "setUserStatus",
                            message: "没有检测到重定向链接",
                            remark: "可能会导致实际的用户状态和获得的用户状态结果不一致",
                        });
                        throw new Error(`Redirected: ${response.url}`);
                    }
                })
                .then(result => Promise.resolve(getUserStatus(notify)))
                .catch(reason => Promise.reject(getUserStatus(notify)));
        }
    });
}

/**
 * @desc 构造无参函数
 */
setUserStatus.withNotify = setUserStatus.bind(null, true);
setUserStatus.withoutNotify = setUserStatus.bind(null, false);

/**
 * @export
 * @param {boolean} [notify=false]
 * @return {Promise<{login: boolean}>}
 * @reject {Promise<{login: boolean}>}
 */
export async function requestSignIn(notify = false) {
    if (notify) {
        return singleton(setUserStatus.withNotify);
    } else {
        return singleton(setUserStatus.withoutNotify);
    }
}

/**
 * @export
 * @return {Promise<{uid: string}>}
 * @reject {Error}
 */
export async function requestUserId() {
    const url = Utils.buildURL("http://login.sina.com.cn/sso/prelogin.php", { entry: "weibo", __rnd: Date.now() });
    return Utils.fetch(url)
        .then(response => response.json())
        .then(json => {
            if (json && json["retcode"] === 0 && json["uid"]) {
                Log.d({
                    module: "requestUserId",
                    message: "获取用户信息成功",
                });
                return { uid: json["uid"] };
            } else {
                Log.w({
                    module: "requestUserId",
                    message: "获取用户信息失败",
                    remark: "这种情况下无法命中缓存，没有其他影响",
                });
                throw new Error(E_MISS_WEIBO_USER_ID);
            }
        });
}

/**
 * @export
 * @param {string} username
 * @param {string} password
 * @return {Promise<void>}
 * @reject {Error}
 */
export async function signInByUserAccount(username, password) {
    if (!username || !password) {
        Log.w({
            module: "signInByUserAccount",
            message: "Not found weibo username and password",
        });
        throw new Error(E_MISS_WEIBO_ACCOUNT);
    }

    // Simultaneous sign in http and https weibo if request https url.
    const url = "https://passport.weibo.cn/sso/login";
    const method = "POST";
    const body = Utils.createSearchParams({
        username: username,
        password: password,
        savestate: "1",
        r: "",
        ec: "2",
        pagerefer: "",
        entry: "mweibo",
        wentry: "",
        loginfrom: "",
        client_id: "",
        code: "",
        qq: "",
        mainpageflag: "1",
        hff: "",
        hfp: "",
    });
    const doneCode = 20000000;
    return Utils.fetch(url, { method, body })
        .then(response => response.json())
        .then(json => {
            if (json && json["retcode"] === doneCode) {
                Log.d({
                    module: "signInByUserAccount",
                    message: "Start request login url",
                    remark: `UserId: ${json["data"]["uid"]}`,
                });
                return Utils.fetch(json["data"]["loginresulturl"]);
            } else {
                const msg = (json && json["msg"]) || E_INVALID_PARSED_DATA;
                Log.w({
                    module: "signInByUserAccount",
                    message: "Invalid Data",
                    remark: json,
                });
                throw new Error(msg);
            }
        })
        .then(response => response.text())
        .then(text => {
            if (text) {
                // noinspection JSUnresolvedFunction
                if (/"retcode":20000000,/.test(text.replace(/\s+/g, ""))) return;
                Log.w({
                    module: "signInByUserAccount:requestLoginUrl",
                    message: "Failed the regex test",
                    remark: text,
                });
                throw new Error(E_CANT_TRANSIT_REGEXP);
            } else {
                Log.w({
                    module: "signInByUserAccount:requestLoginUrl",
                    message: "Invalid Data",
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        });
}
