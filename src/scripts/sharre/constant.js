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
    "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1";

/**
 * @desc Canvas 画布宽或高的最大值
 */
export const MAXIMUM_EDGE = 2 ** 15 - 1;

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
 * @desc menu
 */
export const M_BATCH_DELETE = "menu_batch_delete";
export const M_OPEN_HISTORY = "menu_open_history";
export const M_UPLOAD_IMAGE = "menu_upload_image";
export const M_UPLOAD_FRAME = "menu_upload_frame";
export const M_DOWNLOAD_LOG = "menu_download_log";

/**
 * @desc signal
 */
export const S_WITHOUT_CORS_MODE = "signal_without_cors_mode";
export const S_COMMAND_POINTER_EVENTS = "signal_command_pointer_events";

/**
 * @desc chrome.StorageArea.sync
 */
export const K_AUTO_DISPLAY_CHANGELOG = "auto_display_changelog";
export const K_WEIBO_INHERITED_WATERMARK = "weibo_inherited_watermark";

/**
 * @desc chrome.StorageArea.local
 */
export const K_WEIBO_ACCOUNT_DETAILS = "weibo_account_details"; // 存在本地的微博账号信息
export const K_POPUP_VIEWPORT_DIMENSION = "popup_viewport_dimension";

/**
 * @desc error messages
 */
export const E_INVALID_PARSED_DATA = "E2001: invalid parsed data";
export const E_CANT_TRANSIT_REGEXP = "E2002: can not transit regexp";
export const E_MISS_WEIBO_USER_ID = "E4001: miss weibo user id";
export const E_CANT_CREATE_PALBUM = "E4002: can not create photo album";
export const E_FILE_SIZE_RESTRICT = "E5001: file size restrict";
export const E_FILE_SIZE_OVERFLOW = "E5002: file size overflow";
export const E_FILE_TYPE_RESTRICT = "E5003: file type restrict";
export const E_MISS_WEIBO_ACCOUNT = "E5004: miss weibo account";

/**
 * @desc notification id
 */
export const NID_SIGNIN_RESULT = "nid_signin_result";
export const NID_REMAIN_LOGOUT = "nid_remain_logout";
export const NID_GRAB_RESOURCE = "nid_grab_resource";

/**
 * @desc event type
 */
export const ET_UPLOAD_MUTATION = "et_upload_mutation";

/**
 * @static
 */
export class PConfig {
    /**
     * @see https://support.google.com/webmasters/answer/2598805
     * @see https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support
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
        ];
    }

    /**
     * @desc 微博支持的图片类型
     */
    static get weiboSupportedTypes() {
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

    /**
     * @desc 随机微博图片的 Host
     */
    static get randomImageHost() {
        const rootZone = ".sinaimg.cn";
        const urlPrefix = ["ws1", "ws2", "ws3", "ws4", "wx1", "wx2", "wx3", "wx4"];
        const prefix = urlPrefix[Math.floor(Math.random() * urlPrefix.length)];
        return prefix + rootZone;
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
