/**
 * Popup
 */
document.title = chrome.i18n.getMessage("extension_name");

const backWindow = chrome.extension.getBackgroundPage();
const fileInput = document.querySelector("#file-input");
const browsingHistory = document.querySelector(".head-browsing-history");
const dispatcher = new Dispatcher();
const Resolve = files => {
    return backWindow.Weibo
        .readFile(files, "arrayBuffer", true)
        .then(result => backWindow.Weibo.filePurity(result))
        .then(result => dispatcher.actuator(result));
};

fileInput.accept = Array.from(Weibo.chromeSupportedType).join(",");
fileInput.addEventListener("change", e => Resolve(e.target.files));

browsingHistory.addEventListener("click", e => {
    backWindow.chrome.tabs.create({url: "options.html"});
});

document.addEventListener("keydown", e => {
    e.key === "Escape" && chrome.windows.getCurrent(result => {
        chrome.windows.remove(result.id);
    });
});

document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
    e.preventDefault();
    Resolve(e.dataTransfer.files);
});
