/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {md5} from "../plugin/md5.js";
import {Base64} from "../plugin/base64.js";
import {QCloudStorageAuth} from "../auth/qcloud-storage.js";
import {WEIBO_ALBUM_ID} from "../plugin/constant.js";

const notifyId = Utils.randomString(16);

/**
 * @static
 */
export class ActionCheck {

    /**
     * @public
     * @param {string} ssp
     * @param {Object} obj
     */
    static async fetcher(ssp, obj) {
        const message = await this[ssp](obj[ssp]).catch(reason => {
            return `异常：${reason}`;
        });
        if (message) {
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("notify_icon"),
                title: chrome.i18n.getMessage("info_title"),
                message: message,
                contextMessage: "配置信息验证提示",
            });
        }
    }

    /** @private */
    static async weibo_com() {}

    /** @private */
    static async qcloud_com(o) {
        const {akey: ak, skey: sk, host} = o;

        // 确认该 Bucket 是否存在，是否有权限访问
        const a1 = new QCloudStorageAuth(ak, sk);
        const h1 = await a1.getAuthHeaders("HEAD", "/", host);
        const r1 = await fetch(a1.auths.url.toString(), {headers: h1, method: a1.auths.method});
        if (r1.status === 403) return "当该 Bucket 无访问权限";
        if (r1.status === 404) return "当该 Bucket 不存在";
        if (r1.status !== 200) return `未知 Bucket 错误 - Code: ${r1.status}`;

        // 用来获取 Bucket 的 ACL(access control list)
        // const a2 = new QCloudStorageAuth(ak, sk);
        // const h2 = await a2.getAuthHeaders("GET", "/?acl", host);
        // const r2 = await fetch(a2.auths.url.toString(), {headers: h2, method: a2.auths.method});

        // 检查 Bucket 上跨域资源共享的信息配置
        const a3 = new QCloudStorageAuth(ak, sk);
        const h3 = await a3.getAuthHeaders("GET", "/?cors", host);
        const r3 = await fetch(a3.auths.url.toString(), {headers: h3, method: a3.auths.method});
        const dd3 = Utils.parseXML(await r3.text());
        const dc3 = dd3.querySelector("CORSConfiguration") || document.createElementNS("http://www.w3.org/1999/xhtml", "CORSConfiguration");
        const dr3 = dd3.querySelectorAll("CORSConfiguration > CORSRule");
        for (const rule of dr3) {
            const id = rule.querySelector("ID");
            const origins = rule.querySelectorAll("AllowedOrigin");
            if (id.textContent === WEIBO_ALBUM_ID) {
                for (const n of origins) {
                    if (n.textContent === location.origin) {
                        return "验证通过[1]";
                    }
                }
            }
            origins.forEach(n => {
                if (n.textContent === location.origin) {
                    origins.length > 1 ? n.remove() : rule.remove();
                }
            });
        }

        dc3.append(...Utils.parseXML(`
            <CORSRule>
                <ID>${WEIBO_ALBUM_ID}</ID>
                <AllowedOrigin>${location.origin}</AllowedOrigin>
                <AllowedMethod>GET</AllowedMethod>
                <AllowedMethod>PUT</AllowedMethod>
                <AllowedMethod>HEAD</AllowedMethod>
                <AllowedMethod>POST</AllowedMethod>
                <AllowedMethod>DELETE</AllowedMethod>
                <AllowedHeader>*</AllowedHeader>
                <MaxAgeSeconds>600</MaxAgeSeconds>
                <ExposeHeader>x-cos-request-id</ExposeHeader>
                <ExposeHeader>x-cos-trace-id</ExposeHeader>
            </CORSRule>`).children);

        // 设置 Bucket 的跨域资源共享权限
        const xc = Utils.serializeXML(dc3);
        const a4 = new QCloudStorageAuth(ak, sk);
        const h4 = await a4.getAuthHeaders("PUT", "/?cors", host);
        h4.set("Content-MD5", Base64.encode(md5(xc, true)));
        h4.set("Content-Type", "application/xml");
        const r4 = await fetch(a4.auths.url.toString(), {headers: h4, method: a4.auths.method, body: xc});
        return r4.status === 200 ? "验证通过[2]" : `设置 CORS 配置错误 - Code: ${r4.status}`;
    }


    /** @private */
    static async qiniu_com() {}

    /** @private */
    static async aliyun_com() {}

    /** @private */
    static async upyun_com() {}

}