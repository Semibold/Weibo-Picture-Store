import "./fragment.js";
import {Dispatcher} from "./dispatcher.js";
import {chromeSupportedType} from "../base/register.js";
import {backWindow, fileInput} from "./sharre.js";
import {readFile} from "../sharre/read-file.js";

document.title = chrome.i18n.getMessage("extension_name");

const browsingHistory = document.querySelector(".head-browsing-history");
const dispatcher = new Dispatcher().decorator();
const resolveBlobs = blobs => {
    return readFile(blobs, "arrayBuffer", true)
        .then(result => backWindow.Weibo.filePurity(result))
        .then(result => dispatcher.requestUpload(result));
};

fileInput.accept = Array.from(chromeSupportedType).join(",");
fileInput.addEventListener("change", e => resolveBlobs(e.target.files));

browsingHistory.addEventListener("click", e => {
    backWindow.chrome.tabs.create({url: "history.html"});
});

document.addEventListener("keydown", e => {
    e.key === "Escape" && chrome.windows.getCurrent(result => {
        chrome.windows.remove(result.id);
    });
});

document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
    e.preventDefault();
    resolveBlobs(e.dataTransfer.files);
});
