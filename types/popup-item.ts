/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {WeiboItem} from "./sdata";
import {QCloudItem} from "./sdata";
import {QiniuItem} from "./sdata";
import {AliyunItem} from "./sdata";
import {UpyunItem} from "./sdata";

interface MimeType {
    type: string;
    suffix: string;
}

interface URLData {
    URL: string;
    HTML: string;
    UBB: string;
    Markdown: string;
}

interface WeiboExtra {
    readType?: string;
}

/**
 * @desc Popup 弹窗单条数据的结构
 */
interface PopupItem extends URLData, WeiboExtra {
    fid: string;
    host: string;
    mime: MimeType;
    blob: Blob | File;
    data: WeiboItem | QCloudItem | QiniuItem | AliyunItem | UpyunItem;
}
