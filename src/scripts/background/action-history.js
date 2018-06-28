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
     * @param {Object} o
     */
    static async fetcher(o) {
        if (o.repeat) {
            return await Promise.all([
                getAllPhoto(o.albumInfo, o.page, o.count),
                getAllPhoto(o.albumInfo, o.page + 1, o.count),
            ]).then(([r1, r2]) => {
                r2.list = r1.list.concat(r2.list);
                return r2;
            });
        } else {
            return await getAllPhoto(o.albumInfo, o.page, o.count);
        }
    }

}
