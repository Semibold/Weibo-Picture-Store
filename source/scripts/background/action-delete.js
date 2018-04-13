/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {removePhoto} from "../weibo/remove-photo.js";

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
    static async qcloud_com() {}

    /** @private */
    static async qiniu_com() {}

    /** @private */
    static async aliyun_com() {}

    /** @private */
    static async upyun_com() {}

}