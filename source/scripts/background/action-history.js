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
     * @param {Object|null} [extra.albumInfo]
     * @param {string} [extra.albumInfo.albumId]
     */
    static async trigger(page, size, extra = {}) {
        const data = syncedSData.cdata; // Serve async as sync
        const xdata = await ActionHistory[data.ssp](page, size, extra);
        return Object.assign(xdata, {data: data});
    }

    /** @private */
    static async weibo_com(page, size, extra) {
        return await getAllPhoto(extra.albumInfo, page, size);
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
