/**
 * User Login Status
 */
{

    const doneCode = "100000";
    const loginURL = "http://weibo.com/login.php?url=" + encodeURIComponent("http://weibo.com");
    const url = "http://weibo.com/aj/onoff/getstatus";
    const notifyId = Utils.randomString(16);

    Weibo.getStatus = () => fetch(Utils.createURL(url, {sid: 0}), Utils.blendParams())
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(result => {
            let login = result && result.code === doneCode;
            !login && chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("logout_status_message"),
                contextMessage: chrome.i18n.getMessage("login_hinter_message"),
                requireInteraction: true,
            });
            return {login: login};
        })
        .catch(reason => {
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("check_login_status"),
                contextMessage: chrome.i18n.getMessage("login_hinter_message"),
            });
            return {login: false};
        });

    chrome.notifications.onClicked.addListener(notificationId => {
        notificationId === notifyId && chrome.tabs.create({
            url: loginURL,
        }, tab => chrome.notifications.clear(notifyId));
    });

}
