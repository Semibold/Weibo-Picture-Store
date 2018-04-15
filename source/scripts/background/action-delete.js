/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {md5} from "../plugin/md5.js";
import {removePhoto} from "../weibo/remove-photo.js";
import {Base64} from "../plugin/base64.js";
import {Utils} from "../sharre/utils.js";
import {QCloudStorageAuth} from "../auth/qcloud-storage.js";

/**
 * @static
 */
export class ActionDelete {

    /**
     * @public
     * @param {string} ssp
     * @param {Object} obj
     *
     * @param {Object} [obj.weibo_com]
     * @param {string} [obj.weibo_com.albumId]
     * @param {string[]} [obj.weibo_com.photoIds]
     */
    static async fetcher(ssp, obj) {
        return await this[ssp](obj[ssp]);
    }

    /** @private */
    static async weibo_com(o) {
        return await removePhoto(o.albumId, o.photoIds);
    }

    /** @private */
    static async qcloud_com(o) {
        const {akey, skey, host, path} = o.cdata;
        const qsa = new QCloudStorageAuth(akey, skey);
        const headers = await qsa.getAuthHeaders("POST", "/?delete", host);
        const ndel = document.createElementNS("http://www.w3.org/1999/xhtml", "Delete");
        o.keys.forEach(k => {
            const nobj = document.createElementNS("http://www.w3.org/1999/xhtml", "Object");
            const nkey = document.createElementNS("http://www.w3.org/1999/xhtml", "Key");
            nkey.textContent = k;
            nobj.append(nkey);
            ndel.append(nobj);
        });
        const xc = Utils.serializeXML(ndel);
        headers.set("Content-MD5", Base64.encode(md5(xc, true)));
        headers.set("Content-Length", Utils.bufferFromText(xc).byteLength);
        const res = await fetch(qsa.auths.url.toString(), {headers, method: qsa.auths.method, body: xc});
        const txt = await res.text();
        const doc = Utils.parseXML(txt);
        const eks = doc.querySelectorAll("Error > Key");
        const r = [];
        eks.forEach(k => r.push(k.textContent));
        return {errorKeys: r};
    }

    /** @private */
    static async qiniu_com() {}

    /** @private */
    static async aliyun_com() {}

    /** @private */
    static async upyun_com() {}

}