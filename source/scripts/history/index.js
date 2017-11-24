import {Dispatcher} from "./dispatcher.js";

document.title = `上传记录 - ${chrome.i18n.getMessage("extension_name")}`;
new Dispatcher().decorator();
