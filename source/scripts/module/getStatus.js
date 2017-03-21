/**
 * User Login Status
 */
{

    const ttl = 5 * 60 * 1000; // 5min
    const sid = Utils.randomString(16);
    const notifyId = Utils.randomString(16);
    const doneCode = "100000";
    const loginURL = "http://weibo.com/";
    const urlParam = {
        base: "http://weibo.com/aj/onoff/getstatus",
        param: {sid: 0},
    };

    Weibo.getStatus = (remote, strong) => new Promise((resolve, reject) => {
        if (remote) return resolve();

        chrome.storage.local.get(["login", "timeStamp"], obj => {
            chrome.runtime.lastError && console.warn(chrome.runtime.lastError);

            if (obj.login && Date.now() - obj.timeStamp < ttl) {
                reject({sid, login: true, cache: true});
            } else {
                resolve();
            }
        });
    }).then(result => {
        return fetch(Utils.createURL(urlParam), Utils.blendParams());
    }).then(response => {
        return response.ok ? response.json() : Promise.reject();
    }).then(result => {
        if (result && result.code === doneCode) {
            chrome.storage.local.set({
                login: true,
                timeStamp: Date.now(),
            }, () => chrome.runtime.lastError && console.warn(chrome.runtime.lastError));

            return Promise.reject({sid, login: true, cache: false});
        } else {
            return Promise.reject();
        }
    }).catch(reason => {
        if (reason && reason.sid === sid) {
            if (!reason.cache && !reason.login) {
                chrome.notifications.create(notifyId, {
                    type: "basic",
                    iconUrl: chrome.i18n.getMessage("64"),
                    title: chrome.i18n.getMessage("warn_title"),
                    message: chrome.i18n.getMessage("logout_status_message"),
                    contextMessage: chrome.i18n.getMessage("login_hinter_message"),
                    requireInteraction: true,
                });
            }
            return Promise.resolve({
                login: reason.login,
                cache: reason.cache,
            });
        } else {
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("check_login_status"),
                contextMessage: chrome.i18n.getMessage("login_hinter_message"),
            });
            return strong ? Promise.reject() : Promise.resolve({login: false, cache: false});
        }
    });

    chrome.notifications.onClicked.addListener(notificationId => {
        notificationId === notifyId && chrome.tabs.create({
            url: loginURL,
        }, tab => {
            chrome.notifications.clear(notifyId);
        });
    });

}
