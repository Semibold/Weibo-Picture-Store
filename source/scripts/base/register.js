export const rootZone = ".sinaimg.cn";
export const loginWeiboURL = "http://weibo.com/login.php?url=" + encodeURIComponent("http://weibo.com");

/**
 * 微博传图的图片大小限制
 */
export const maximumFileSize = 20 * 1024 * 1024 - 1;

/**
 * 微博支持的图片类型
 */
export const acceptType = {
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

// https://support.google.com/webmasters/answer/2598805
// https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support
export const chromeSupportedType = new Set([
    "image/jpeg",
    "image/png",
    "image/apng",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/x-icon",
]);

export const distinctProp = {
    property: "2",
    caption: "Weibo_Chrome",
    description: "ImUfrNWhuFTTOXASFgdCVVv2ZUIquXrKjqiey2r95Kqudh6sjaBUWFdcwtlGEX2w", // 64 位特征码
    answer: "",
    question: "",
    album_id: "",
};

/**
 * 支持 https 的主机记录集合
 */
export const urlPrefix = [
    "ws1", "ws2", "ws3", "ws4",
    "wx1", "wx2", "wx3", "wx4",
];

export const startConfig = {
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

export const transferType = {
    fromUser: "WB.add_selector_listener",
    fromBase64: "CE.data_from_base64",
    fromBackground: "CE.data_from_background",
    fromImageFrame: "CE.data_from_image_frame",
    fromVideoFrame: "CE.data_from_video_frame",
    fromCanvasFrame: "CE.data_from_canvas_frame",
    fromChromeCommand: "CE.data_from_chrome_command",
    fromWithoutCORSMode: "CE.data_from_without_cors_mode",
};
