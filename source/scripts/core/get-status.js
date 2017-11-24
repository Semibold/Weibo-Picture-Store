import {Utils} from "../base/utils.js";

const doneCode = "100000";
const url = Utils.buildURL("http://weibo.com/aj/onoff/getstatus", {sid: 0});

export const notifyId = Utils.randomString(16);
export const getStatus = (isNotification = false) => {
    return Utils.fetch(url).then(response => {
        return response.ok ? response.json() : Promise.reject(response.status);
    }).then(json => {
        if (json && json.code === doneCode) {
            return {login: true};
        } else {
            isNotification && chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("being_logout_status"),
                contextMessage: chrome.i18n.getMessage("goto_login_page_hinter"),
                requireInteraction: true,
            });
            return {login: false};
        }
    }).catch(reason => {
        isNotification && chrome.notifications.create(notifyId, {
            type: "basic",
            iconUrl: chrome.i18n.getMessage("64"),
            title: chrome.i18n.getMessage("warn_title"),
            message: chrome.i18n.getMessage("check_logging_status"),
            contextMessage: chrome.i18n.getMessage("goto_login_page_hinter"),
            requireInteraction: true,
        });
        return {login: false};
    });
};
Utils.sharre(getStatus);
