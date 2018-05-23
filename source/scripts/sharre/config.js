/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @static
 */
export class Config {

    /**
     * @desc 同步控制 - 固定值
     * @return {string}
     */
    static get synckey() {
        return "synced";
    }

    /**
     * @desc 存储用户配置的 keys 数组
     * @return {string[]}
     */
    static get sakeys() {
        return ["selectindex", ...Config.ssps];
    }

    /**
     * @enum
     * @desc Storage Service Provider (as identity)
     * @return {string[]}
     */
    static get ssps() {
        return [
            "weibo_com",
            "qcloud_com",
            "qiniu_com",
            "aliyun_com",
            "upyun_com",
        ];
    }

    /**
     * @desc 配置禁用选项
     * @return {Object}
     */
    static get inactived() {
        return {
            weibo_com: false,
            tencent_com: false,
            qiniu_com: true,
            aliyun_com: true,
            upyun_com: true,
        };
    }

    /**
     * @return {number}
     */
    static get selectindex() {
        return 0;
    }

    /**
     * @return {Object}
     */
    static get sspsdata() {
        return {
            weibo_com: {
                ssp: "weibo_com",
            },
            qcloud_com: {
                ssp: "qcloud_com",
                mark: "",
                akey: "",
                skey: "",
                host: "",
                path: "",
                pics: "",
            },
            qiniu_com: {
                ssp: "qiniu_com",
            },
            aliyun_com: {
                ssp: "aliyun_com",
            },
            upyun_com: {
                ssp: "upyun_com",
            },
        };
    }

    /**
     * @return {Object}
     */
    static get preothers() {
        return {
            updatebtn: {disabled: false},
            saveasbtn: {disabled: false},
            deletebtn: {disabled: false},
        };
    }

    /**
     * @return {Object}
     */
    static get predefine() {
        return {
            weibo_com: {
                updatebtn: {disabled: true},
                saveasbtn: {disabled: true},
                deletebtn: {disabled: true},
            },
            qcloud_com: {
                updatebtn: {disabled: false},
                saveasbtn: {disabled: false},
                deletebtn: {disabled: true},
            },
            qiniu_com: {
                updatebtn: {disabled: false},
                saveasbtn: {disabled: false},
                deletebtn: {disabled: true},
            },
            aliyun_com: {
                updatebtn: {disabled: false},
                saveasbtn: {disabled: false},
                deletebtn: {disabled: true},
            },
            upyun_com: {
                updatebtn: {disabled: false},
                saveasbtn: {disabled: false},
                deletebtn: {disabled: true},
            },
        };
    }

    /**
     * @return {Object}
     */
    static get restricte() {
        return {
            weibo_com: {
                filesize: 20 * 1024 ** 2 - 1,
                sizename: "20MB",
            },
            qcloud_com: {
                filesize: 5 * 1024 ** 3 - 1,
                sizename: "5GB",
            },
            qiniu_com: {
                filesize: 0,
                sizename: "0B",
            },
            aliyun_com: {
                filesize: 0,
                sizename: "0B",
            },
            upyun_com: {
                filesize: 0,
                sizename: "0B",
            },
        };
    }

    /**
     * @return {Object}
     */
    static get thumbnail() {
        return {
            weibo_com: {
                1: "large",
                2: "mw690",
                3: "thumbnail",
            },
            qcloud_com: {
                1: "?imageMogr2/quality/95",
                2: "?imageMogr2/thumbnail/720x720/quality/90",
                3: "?imageMogr2/thumbnail/360x360/quality/90",
            },
            qiniu_com: {
                1: "",
                2: "",
                3: "",
            },
            aliyun_com: {
                1: "",
                2: "",
                3: "",
            },
            upyun_com: {
                1: "",
                2: "",
                3: "",
            },
        };
    }

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
     * @see https://en.wikipedia.org/wiki/Image_file_formats
     */
    static get filenameExtensions() {
        return [
            ".jpg", ".jpeg",
            ".png", ".apng",
            ".gif", ".bmp",
            ".ico", ".webp",
        ];
    }

    /**
     * @desc 微博支持的图片类型
     */
    static get weiboAcceptType() {
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

}