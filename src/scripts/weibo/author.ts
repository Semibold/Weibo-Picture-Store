/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";
import { singleton } from "./banker.js";
import {
    E_CANT_TRANSIT_REGEXP,
    E_INVALID_PARSED_DATA,
    E_MISS_WEIBO_ACCOUNT,
    E_WEIBO_USER_ID_SLIP,
    K_WEIBO_ACCOUNT_DETAILS,
    NID_LOGIN_RESULT,
    NID_REMAIN_LOGOUT,
} from "../sharre/constant.js";
import { tryActivateUserStatus } from "./activator.js";
import { chromeStorageLocal } from "../sharre/chrome-storage.js";

/**
 * @no-reject
 */
async function getUserStatus(notify: boolean): Promise<WB.LoginInfo> {
    return Utils.fetch(Utils.buildURL("https://weibo.com/aj/onoff/getstatus", { sid: 0 }))
        .then((response) => response.json())
        .then((json) => {
            if (json && json["code"] === "100000") {
                Utils.log.d({
                    module: "getUserStatus",
                    remark: "用户处于登录状态",
                });
                return { login: true };
            } else {
                notify &&
                    Utils.notify(NID_REMAIN_LOGOUT, {
                        title: chrome.i18n.getMessage("warn_title"),
                        message: "微博处于登出状态，单击转到微博的登录页面",
                    });
                Utils.log.w({
                    module: "getUserStatus",
                    remark: "用户处于登出状态",
                });
                return { login: false };
            }
        })
        .catch((reason) => {
            notify &&
                Utils.notify(NID_REMAIN_LOGOUT, {
                    title: chrome.i18n.getMessage("warn_title"),
                    message: "微博登录信息校验失败，单击转到微博的登录页面",
                });
            Utils.log.e({
                module: "getUserStatus",
                error: reason,
                remark: "请求发生错误，假设用户处于登出状态，可能会导致实际的用户状态和获得的用户状态结果不一致",
            });
            return { login: false };
        });
}

/**
 * Singleton
 *
 * @reject {Promise<{login: boolean}>} - 用户已登录或者网络请求错误
 */
async function setUserStatus(notify: boolean): Promise<WB.LoginInfo> {
    return getUserStatus(false).then(async (json) => {
        if (json.login) {
            Utils.log.w({
                module: "setUserStatus",
                remark: "检测到用户处于登录状态，中断激活用户登录状态的操作",
            });
            return Promise.reject(json);
        }

        const accountInfo = chromeStorageLocal.get()[K_WEIBO_ACCOUNT_DETAILS];

        if (accountInfo.allowUserAccount) {
            return signInByUserAccount(accountInfo.username, accountInfo.password)
                .catch((reason) => {
                    notify &&
                        Utils.notify(NID_LOGIN_RESULT, {
                            title: chrome.i18n.getMessage("fail_title"),
                            message: "登录失败，请检查微博账户信息及网络情况",
                        });
                    return Promise.reject(reason);
                })
                .then((result) => Promise.resolve(getUserStatus(false)))
                .catch((reason) => Promise.reject(getUserStatus(false)));
        }

        return Utils.fetch("https://weibo.com/aj/onoff/setstatus", {
            method: "POST",
            body: Utils.createSearchParams({ sid: 0, state: 0 }),
        })
            .then((response) => {
                if (response.redirected) {
                    Utils.log.d({
                        module: "setUserStatus",
                        remark: "用户可能处于未激活的登录状态，尝试激活",
                    });
                    return tryActivateUserStatus(response.url);
                } else {
                    Utils.log.e({
                        module: "setUserStatus",
                        remark: "没有检测到重定向链接，可能会导致实际的用户状态和获得的用户状态结果不一致",
                    });
                    throw new Error(`Redirect link: ${response.url}`);
                }
            })
            .then((result) => Promise.resolve(getUserStatus(notify)))
            .catch((reason) => Promise.reject(getUserStatus(notify)));
    });
}

/**
 * @desc 构造无参函数
 */
setUserStatus.withNotify = setUserStatus.bind(null, true);
setUserStatus.withoutNotify = setUserStatus.bind(null, false);

/**
 * @export
 * @reject {Promise<LoginInfo>}
 */
export async function requestSignIn(notify = false): Promise<WB.LoginInfo> {
    if (notify) {
        return singleton(setUserStatus.withNotify);
    } else {
        return singleton(setUserStatus.withoutNotify);
    }
}

/**
 * @export
 * @reject {Error}
 */
export async function requestUserId(): Promise<WB.UidInfo> {
    const url = Utils.buildURL("https://login.sina.com.cn/sso/prelogin.php", { entry: "weibo", __rnd: Date.now() });
    return Utils.fetch(url)
        .then((response) => response.json())
        .then((json) => {
            if (json && json["retcode"] === 0 && json["uid"]) {
                Utils.log.d({
                    module: "requestUserId",
                    remark: "获取用户信息成功",
                });
                return { uid: json["uid"] };
            } else {
                Utils.log.w({
                    module: "requestUserId",
                    remark: "获取用户信息失败，这种情况下无法命中缓存",
                });
                throw new Error(E_WEIBO_USER_ID_SLIP);
            }
        });
}

/**
 * @export
 * @reject {Error}
 */
export async function requestUserCaptcha(username: string): Promise<WB.CaptchaInfo> {
    const url = Utils.buildURL("https://login.sina.com.cn/sso/prelogin.php", {
        checkpin: 1,
        su: btoa(encodeURIComponent(username)),
        entry: "mweibo",
        __rnd: Date.now(),
    });
    return Utils.fetch(url)
        .then((response) => response.json())
        .then((json) => {
            if (json && json["retcode"] === 0 && json["showpin"] != null) {
                Utils.log.d({
                    module: "requestUserCaptcha",
                    remark: "获取用户信息成功",
                });
                return { showpin: json["showpin"] };
            } else {
                Utils.log.w({
                    module: "requestUserCaptcha",
                    remark: "获取用户信息失败，请求异常或输入的用户名不正确",
                });
                throw new Error(E_WEIBO_USER_ID_SLIP);
            }
        });
}

/**
 * @export
 * @reject {Error}
 */
export async function signInByUserAccount(username: string, password: string): Promise<void> {
    if (!username || !password) {
        Utils.log.w({
            module: "signInByUserAccount",
            remark: "缺少微博账户信息",
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
        r: "https://m.weibo.cn/",
        ec: "0",
        pagerefer: "https://m.weibo.cn/",
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
    const secondVerifyCode = 50050011;
    return Utils.fetch(url, { method, body })
        .then((response) => response.json())
        .then((json) => {
            if (json && json["retcode"] === doneCode) {
                Utils.log.d({
                    module: "signInByUserAccount",
                    remark: `UserId: ${json["data"]["uid"]}`,
                });
                return Utils.fetch(json["data"]["loginresulturl"]);
            } else {
                if (json && json["retcode"] === secondVerifyCode) {
                    const error = new Error("由于登录此账户需要两步验证，因此无法使用自动登录功能");

                    Utils.log.w({
                        module: "signInByUserAccount",
                        error: json,
                        remark: error.message,
                    });

                    throw error;
                }
                /**
                 * @return {Promise<Error>}
                 * @no-resolve
                 */
                return requestUserCaptcha(username)
                    .then((json) => {
                        if (json.showpin) {
                            return json;
                        } else {
                            // Catch this error in next `catch` microtask and raise real exception
                            throw new Error(`needCaptcha: ${json.showpin}`);
                        }
                    })
                    .catch((reason) => {
                        const msg = (json && json["msg"]) || E_INVALID_PARSED_DATA;
                        Utils.log.w({
                            module: "signInByUserAccount",
                            error: Utils.safeMixinError`json: ${json}; reason: ${reason}`,
                        });
                        throw new Error(msg);
                    })
                    .then((json) => {
                        // You don't have to validate `showpin` repeatedly
                        const obj = {
                            module: "signInByUserAccount",
                            error: json,
                            remark: "由于登录此账户需要验证码，因此无法使用自动登录功能",
                        };
                        Utils.log.w(obj);
                        throw new Error(obj.remark);
                    });
            }
        })
        .then((response) => response.text())
        .then((text) => {
            if (text) {
                // noinspection JSUnresolvedFunction
                if (/"retcode":20000000,/.test(text.replace(/\s+/g, ""))) return;
                Utils.log.w({
                    module: "signInByUserAccount:requestLoginUrl",
                    error: text,
                    remark: "未能通过正则表达式测试",
                });
                throw new Error(E_CANT_TRANSIT_REGEXP);
            } else {
                Utils.log.w({
                    module: "signInByUserAccount:requestLoginUrl",
                    remark: "无效数据",
                });
                throw new Error(E_INVALID_PARSED_DATA);
            }
        });
}
