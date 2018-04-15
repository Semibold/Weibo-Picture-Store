/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {getAllPhoto} from "../weibo/get-all-photo.js";
import {QCloudStorageAuth} from "../auth/qcloud-storage.js";
import {Utils} from "../sharre/utils.js";
import {Config} from "../sharre/config.js";

/**
 * @static
 */
export class ActionHistory {

    /**
     * @public
     * @param {string} ssp
     * @param {Object} obj
     *
     * @param {Object} [obj.weibo_com]
     * @param {number} [obj.weibo_com.page]
     * @param {number} [obj.weibo_com.count]
     * @param {string} [obj.weibo_com.albumInfo]
     *
     * @param {Object} [obj.qcloud_com]
     * @param {number} [obj.qcloud_com.page]
     * @param {number} [obj.qcloud_com.count]
     * @param {string} [obj.qcloud_com.marker]
     * @param {string} [obj.qcloud_com.cdata]
     */
    static async fetcher(ssp, obj) {
        return await ActionHistory[ssp](obj[ssp]);
    }

    /** @private */
    static async weibo_com(o) {
        return await getAllPhoto(o.albumInfo, o.page, o.count);
    }

    /** @private */
    static async qcloud_com(o) {
        const {akey, skey, host, path} = o.cdata;
        const qsa = new QCloudStorageAuth(akey, skey);
        const headers = await qsa.getAuthHeaders("GET", "/", host);
        const searchParams = qsa.auths.url.searchParams;
        searchParams.set("prefix", path);
        searchParams.set("delimiter", "/");
        searchParams.set("marker", o.marker);
        searchParams.set("max-keys", o.count);
        const res = await fetch(qsa.auths.url.toString(), {headers, method: qsa.auths.method});
        const text = await res.text();
        const doc = Utils.parseXML(text);
        const contents = doc.querySelectorAll("ListBucketResult > Contents");
        const isTruncated = doc.querySelector("IsTruncated");
        const marker = doc.querySelector("Marker");
        const nextMarker = doc.querySelector("NextMarker");
        const list = [];
        contents.forEach(c => {
            const key = c.querySelector("Key");
            if (Config.filenameExtensions.some(ext => key.textContent.endsWith(ext))) {
                const lastModified = c.querySelector("LastModified");
                list.push({
                    picName: key.textContent,
                    picHost: "http://" + o.cdata.pics || o.cdata.host,
                    updated: Utils.formatDate(lastModified.textContent),
                });
            }
        });
        return {
            list: list,
            marker: marker.textContent,
            nextMarker: nextMarker ? nextMarker.textContent : "",
            isTruncated: JSON.parse(isTruncated.textContent),
        };
    }

    /** @private */
    static async qiniu_com() {}

    /** @private */
    static async aliyun_com() {}

    /** @private */
    static async upyun_com() {}

}
