document.title = chrome.i18n.getMessage("extension_name");

const backWindow = chrome.extension.getBackgroundPage();
const fileInput = document.querySelector("#file-input");
const browsingHistory = document.querySelector(".head-browsing-history");
const dispatcher = new Dispatcher().decorator();
const resolveBlobs = blobs => {
    return backWindow.Weibo
        .readFile(blobs, "arrayBuffer", true)
        .then(result => backWindow.Weibo.filePurity(result))
        .then(result => dispatcher.requestUpload(result));
};

fileInput.accept = Array.from(Weibo.chromeSupportedType).join(",");
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
