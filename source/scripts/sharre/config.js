/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @static
 */
class InternalConf {

    static get headroom() {
        return {
            selectindex: 0,
            preothers: {
                updatebtn: {disabled: false},
                saveasbtn: {disabled: false},
                deletebtn: {disabled: false},
            },
            predefine: {
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
            },
            restricte: {
                weibo_com: {
                    filesize: 20 * 1024 ** 2 - 1, // 20MB
                },
                qcloud_com: {
                    filesize: 5 * 1024 ** 3 - 1, // 5GB
                },
                qiniu_com: {
                    filesize: 0,
                },
                aliyun_com: {
                    filesize: 0,
                },
                upyun_com: {
                    filesize: 0,
                },
            },
            structure: {
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
            },
        };
    }

}


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
        return InternalConf.headroom.selectindex;
    }

    /**
     * @return {Object}
     */
    static get sspsdata() {
        return InternalConf.headroom.structure;
    }

    /**
     * @return {Object}
     */
    static get preothers() {
        return InternalConf.headroom.preothers;
    }

    /**
     * @return {Object}
     */
    static get predefine() {
        return InternalConf.headroom.predefine;
    }

    /**
     * @return {Object}
     */
    static get restricte() {
        return InternalConf.headroom.restricte;
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
     * @return {Object}
     */
    static get weiboPopup() {
        return {
            scheme: {
                1: "http://",
                2: "https://",
                3: "//",
            },
            clipsize: {
                1: "large",
                2: "mw690",
                3: "thumbnail",
                4: "",
            },
        };
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