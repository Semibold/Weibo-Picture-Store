/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {getAllPhoto} from "../weibo/get-all-photo.js";
import {syncedSData} from "./synced-sdata.js";

/**
 * @static
 */
export class ActionHistory {

    /**
     * @public
     * @param {number} page
     * @param {number} size
     * @param {Object} [extra]
     *
     * @param {Object|null} [extra.weibo_com]
     * @param {string} [extra.weibo_com.albumId]
     */
    static async trigger(page, size, extra = {}) {
        const data = syncedSData.cdata; // Serve async as sync
        return await ActionHistory[data.ssp](page, size, extra);
    }

    /** @private */
    static async weibo_com(page, size, extra) {
        return await getAllPhoto(extra.weibo_com, page, size);
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
