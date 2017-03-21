/**
 * Utils
 */
const Utils = {

    [Symbol.for("guid")]: 1,

    get guid() {
        return String(this[Symbol.for("guid")]++);
    },

    createSearchParams(obj, former) {
        let searchParams = new URLSearchParams(former);

        if (obj) {
            for (let [key, value] of Object.entries(obj)) {
                searchParams.append(key, value);
            }
        }

        return searchParams;
    },

    createURL(url, obj) {
        if (url && typeof url === "object") {
            obj = url.param;
            url = url.base;
        }

        let base = new URL(url);
        let searchParams = this.createSearchParams(obj, base.search);

        base.search = searchParams.toString();
        return base.href;
    },

    blendParams(obj) {
        return Object.assign({}, {
            method: "GET",
            mode: "cors",
            credentials: "include",
            cache: "no-cache",
            redirect: "follow",
            referrer: "client",
        }, obj);
    },

    randomString(length) {
        let buffer = [];
        let len = Math.abs(length) || 0;
        let charPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        while (len) {
            buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
            len--;
        }

        return buffer.join("");
    },

    fetchImage(imageURL) {
        return fetch(imageURL, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            redirect: "follow",
            referrer: "client",
        }).then(response => {
            return response.ok ? response.blob() : Promise.reject();
        }).catch(reason => {
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("get_image_url_fail"),
            });
            return Promise.reject(reason);
        });
    },

    checkImageURL(str, force) {
        try {
            let url = new URL(str);
            let result = new RegExp(`.+\\.(${Weibo.imagePostface})$`).test(url.pathname);
            return force ? result : result && !url.origin.includes(Weibo.rootZone);
        } catch (e) {
            return false;
        }
    },

};
