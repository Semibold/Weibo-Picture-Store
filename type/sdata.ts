/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

interface WeiboItem {
  ssp: "weibo_com";
}

interface QCloudItem {
  ssp: "qcloud_com";
  mark: string;
  akey: string;
  skey: string;
  host: string;
  path: string;
}

interface QiniuItem {
  ssp: "qiniu_com";
}

interface AliyunItem {
  ssp: "aliyun_com";
}

interface UpyunItem {
  ssp: "upyun_com";
}

/**
 * @desc 用于初始化 options page 的数据结构
 * @desc 需要保证结构的完整性，内部操作不会校验属性的存在性
 */
interface SDataStructure {
  selectindex: number;
  syncdata: boolean;
  weibo_com: WeiboItem[];
  qcloud_com: QCloudItem[];
  qiniu_com: QiniuItem[];
  aliyun_com: AliyunItem[];
  upyun_com: UpyunItem[];
}
