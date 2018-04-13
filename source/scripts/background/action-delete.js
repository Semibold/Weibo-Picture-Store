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
     * @param {string} [obj.albumId]
     * @param {string[]} [obj.photoIds]
     */
    static async fetcher(ssp, obj) {
        return await this[ssp](obj);
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