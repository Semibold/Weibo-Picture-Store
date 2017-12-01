import {transferType} from "../base/register.js";
import {readFile} from "./read-file.js";

export const defaultPrefix = "https://ws1.sinaimg.cn/large/";
export const defaultSuffix = "";
export const resolveBlobs = (blobs, item, prefix, suffix) => {
    readFile(blobs)
        .then(result => chrome.runtime.sendMessage({
            type: transferType.fromBase64,
            item: item,
            result: result,
            prefix: prefix,
            suffix: suffix,
        }));
};
