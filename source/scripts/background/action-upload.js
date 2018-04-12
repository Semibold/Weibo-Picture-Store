/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {filePurity} from "../sharre/file-purity.js";
import {readFile} from "../weibo/read-file.js";
import {fileUpload} from "../weibo/file-upload.js";
import {Utils} from "../sharre/utils.js";

/**
 * @static
 */
export class ActionUpload {

    /** @public */
    static async trigger(item) {
        if (item) {
            console.log(item)
            return await ActionUpload[item.data.ssp](item).catch(Utils.noop);
        }
    }

    /** @private */
    static async weibo_com(s1) {
        const s2 = await readFile(s1);
        const s3 = await filePurity(s2);
        if (s3) {
            return await fileUpload(s3);
        }
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
