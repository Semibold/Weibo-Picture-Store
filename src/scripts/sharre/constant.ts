/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 固定的 64 位特征码
 */
export const FEATURE_ID = "ImUfrNWhuFTTOXASFgdCVVv2ZUIquXrKjqiey2r95Kqudh6sjaBUWFdcwtlGEX2w";
export const PSEUDO_MOBILE_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

/**
 * @desc Canvas 画布宽或高的最大值
 */
export const MAXIMUM_EDGE = 2 ** 15 - 1;

/**
 * @desc Preserve 1~10000
 */
export const MINIMUM_RULE_ID = 10001;

/**
 * @desc 微博图片最大的文件大小
 */
export const MAXIMUM_WEIBO_PICTURE_SIZE = 20 * 1024 * 1024 - 1;
export const UNKNOWN_FILE_SIZE_RESTRICT = MAXIMUM_WEIBO_PICTURE_SIZE * 2;

/**
 * @desc FileProgress 的类型
 */
export const FP_TYPE_UPLOAD = 1;
export const FP_TYPE_DOWNLOAD = 2;
export const FPC_SUCCEED = 1;
export const FPC_DISCARD = 2;
export const FPC_FAILURE = 3;

/**
 * @desc Menu
 */
export const M_BATCH_DELETE = "M_BATCH_DELETE";
export const M_OPEN_HISTORY = "M_OPEN_HISTORY";
export const M_UPLOAD_IMAGE = "M_UPLOAD_IMAGE";
export const M_UPLOAD_FRAME = "M_UPLOAD_FRAME";
export const M_DOWNLOAD_LOG = "M_DOWNLOAD_LOG";

/**
 * @desc chrome.StorageArea.sync
 */
export const K_AUTO_DISPLAY_CHANGELOG = "auto_display_changelog";
export const K_WEIBO_INHERITED_WATERMARK = "weibo_inherited_watermark";

/**
 * @desc chrome.StorageArea.local
 */
export const K_WEIBO_ACCOUNT_DETAILS = "weibo_account_details"; // 存在本地的微博账号信息
export const K_WEIBO_SCHEME_TYPE = "custom_scheme_type";
export const K_WEIBO_CLIP_TYPE = "custom_clip_type";
export const K_WEIBO_CLIP_VALUE = "custom_clip_value";
export const K_RULE_ID_POINTER = "rule_id_pointer";

/**
 * @desc Error messages
 */
export const E_INVALID_PARSED_DATA = "E2001: 解析后的数据无效";
export const E_CANT_TRANSIT_REGEXP = "E2002: 未能通过正则表达式测试";
export const E_WEIBO_USER_ID_SLIP = "E4001: 微博用户名不正确";
export const E_CANT_CREATE_ALBUM = "E4002: 不能创建微相册";
export const E_FILE_SIZE_RESTRICT = "E5001: 文件大小超出约束范围";
export const E_FILE_SIZE_OVERFLOW = "E5002: 文件大小过载";
export const E_FILE_TYPE_RESTRICT = "E5003: 文件类型超出约束范围";
export const E_MISS_WEIBO_ACCOUNT = "E5004: 缺少微博账户信息";

/**
 * @desc Notification ID
 */
export const NID_LOGIN_RESULT = "NID_LOGIN_RESULT";
export const NID_REMAIN_LOGOUT = "NID_REMAIN_LOGOUT";
export const NID_GRAB_RESOURCE = "NID_GRAB_RESOURCE";
export const NID_MISMATCH_CORS = "NID_MISMATCH_CORS";
export const NID_UPLOAD_RESULT = "NID_UPLOAD_RESULT";
export const NID_COPY_URL_FAIL = "NID_COPY_URL_FAIL";

export const K_OFFSCREEN_QUERY_NAME = "srcUrl";

/**
 * @static
 */
export class PConfig {
    /**
     * @see https://support.google.com/webmasters/answer/2598805
     * @see https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support
     * @see https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#apng_animated_portable_network_graphics
     * @return {string[]}
     */
    static get chromeSupportedTypes() {
        return [
            "image/jpeg",
            "image/png",
            "image/apng",
            "image/gif",
            "image/bmp",
            "image/webp",
            "image/x-icon",
            "image/svg+xml",
            "image/avif",
        ];
    }

    /**
     * @desc 微博支持的图片类型
     */
    static get weiboSupportedTypes(): Record<string, { type: string; typo: string }> {
        return {
            "image/jpeg": {
                type: ".jpg",
                typo: ".jpg",
            },
            "image/png": {
                type: ".png",
                typo: ".jpg",
            },
            "image/apng": {
                type: ".png",
                typo: ".jpg",
            },
            "image/gif": {
                type: ".gif",
                typo: ".gif",
            },
        };
    }

    static get urlPrefix() {
        // return ["wx1", "wx2", "wx3", "wx4"];
        // return ["tva1", "tva2", "tva3", "tva4", "tvax1", "tvax2", "tvax3", "tvax4"];
        return ["tvax1", "tvax2", "tvax3", "tvax4"];
    }

    /**
     * @desc 随机微博图片的域名前缀
     */
    static get randomImagePrefix() {
        const urlPrefix = PConfig.urlPrefix;
        return urlPrefix[Math.floor(Math.random() * urlPrefix.length)];
    }

    /**
     * @desc 随机微博图片的 Host
     */
    static get randomImageHost() {
        const rootZone = ".sinaimg.cn";
        return PConfig.randomImagePrefix + rootZone;
    }

    /**
     * @desc 默认的选项配置
     */
    static get defaultOptions() {
        return {
            autoDisplayChangelog: true,
            inheritWeiboWatermark: false,
            weiboAccountDetails: {
                username: "",
                password: "",
                allowUserAccount: false,
            },
        };
    }
}
