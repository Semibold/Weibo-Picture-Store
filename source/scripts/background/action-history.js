/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {getAllPhoto} from "../weibo/get-all-photo.js";

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
     */
    static async fetcher(ssp, obj) {
        return await ActionHistory[ssp](obj[ssp]);
    }

    /** @private */
    static async weibo_com(o) {
        return await getAllPhoto(o.albumInfo, o.page, o.count);
    }

    /** @private */
    static async qcloud_com() {}

    /** @private */
    static async qiniu_com() {}

    /** @private */
    static async aliyun_com() {}

    /** @private */
    static async upyun_com() {}

}
