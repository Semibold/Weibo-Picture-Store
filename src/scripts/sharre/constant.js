/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @desc 固定的 64 位特征码
 */
export const FEATURE_ID = "ImUfrNWhuFTTOXASFgdCVVv2ZUIquXrKjqiey2r95Kqudh6sjaBUWFdcwtlGEX2w";

/**
 * @desc Canvas 画布宽或高的最大值
 */
export const MAXIMUM_EDGE = 2 ** 15 - 1;

/**
 * @desc FileProgress 的类型
 */
export const FP_TYPE_UPLOAD = 1;
export const FP_TYPE_DOWNLOAD = 2;

/**
 * @desc menu
 */
export const M_BATCH_DELETE = "menu_batch_delete";
export const M_UPLOAD_HISTORY = "menu_upload_history";
export const M_UPLOAD_IMAGE = "menu_upload_image";
export const M_VIDEO_FRAME = "menu_video_frame";

/**
 * @desc signal
 */
export const S_WITHOUT_CORS_MODE = "signal_without_cors_mode";
export const S_COMMAND_POINTER_EVENTS = "signal_command_pointer_events";

/**
 * @desc 多用户的 Cache
 */
export const USER_INFO_CACHE = new Map();

/**
 * @desc APIs 的单例模式
 */
export const SINGLETON_CACHE = new Map();

/**
 * @static
 */
export default class {

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

    static get randomImageHost() {
        const rootZone = ".sinaimg.cn";
        const urlPrefix = [
            "ws1", "ws2", "ws3", "ws4",
            "wx1", "wx2", "wx3", "wx4",
        ];
        const prefix = urlPrefix[Math.floor(Math.random() * urlPrefix.length)];
        return prefix + rootZone;
    }

}
