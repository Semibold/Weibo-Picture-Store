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
     * @param {Object} o
     */
    static async fetcher(o) {
        return await removePhoto(o.albumId, o.photoIds);
    }

}
