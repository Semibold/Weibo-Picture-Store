/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

export interface WeiboItem {
    ssp: "weibo_com";
}

export interface QCloudItem {
    ssp: "qcloud_com";
    mark: string;
    akey: string;
    skey: string;
    host: string;
    path: string;
}

export interface QiniuItem {
    ssp: "qiniu_com";
}

export interface AliyunItem {
    ssp: "aliyun_com";
}

export interface UpyunItem {
    ssp: "upyun_com";
}

/**
 * @desc 需要保证结构的完整性，内部操作不会校验属性的存在性
 */
export interface SData {
    synced: boolean;

    selectindex: number;
    weibo_com: WeiboItem[];
    qcloud_com: QCloudItem[];
    qiniu_com: QiniuItem[];
    aliyun_com: AliyunItem[];
    upyun_com: UpyunItem[];
}
