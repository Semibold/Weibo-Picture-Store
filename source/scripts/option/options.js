/**
 * Options
 */
document.title = `上传记录 - ${chrome.i18n.getMessage("extension_name")}`;

const backWindow = chrome.extension.getBackgroundPage();
new Dispatcher();
