/**
 * Options
 */
document.title = chrome.i18n.getMessage("extension_name");

const backWindow = chrome.extension.getBackgroundPage();
new Dispatcher();
