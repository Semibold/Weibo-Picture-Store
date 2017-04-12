/**
 * Register
 */
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

Weibo.imagePostface = Object.values(Weibo.acceptType).map(item => item.type.slice(1)).join("|");

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

Weibo.rootZone = ".sinaimg.cn";

Weibo.startConfig = {
    scheme: {
        1: "http://",
        2: "https://",
        3: "//",
    },
    clipSize: {
        1: "large",
        2: "mw690",
        3: "thumbnail",
        4: "",
    },
};
