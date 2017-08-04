Weibo.rootZone = ".sinaimg.cn";

Weibo.acceptType = {
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
Weibo.chromeSupportedType = new Set([
    "image/jpeg",
    "image/png",
    "image/apng",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/x-icon",
]);

Weibo.distinctProp = {
    property: "2",
    caption: "Weibo_Chrome",
    description: "ImUfrNWhuFTTOXASFgdCVVv2ZUIquXrKjqiey2r95Kqudh6sjaBUWFdcwtlGEX2w", // 64 位特征码
    answer: "",
    question: "",
    album_id: "",
};

Weibo.urlPrefix = [
    "ws1", "ws2", "ws3", "ws4",
    "wx1", "wx2", "wx3", "wx4",
];

Weibo.startConfig = {
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

Weibo.transferType = {
    fromUser: "WB.add_selector_listener",
    fromBase64: "CE.data_from_base64",
    fromBackground: "CE.data_from_background",
    fromVideoFrame: "CE.data_from_video_frame",
};
