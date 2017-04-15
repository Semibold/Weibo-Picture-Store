/**
 * Utils
 */
const Utils = {

    [Symbol.for("guid")]: 1,
    [Symbol.for("sole")]: new Map(),

    get guid() {
        return String(this[Symbol.for("guid")]++);
    },

    noop() {},

    singleton(fn, ...params) {
        let sole = this[Symbol.for("sole")];

        if (!sole.has(fn)) {
            sole.set(fn, fn(...params).then(result => {
                sole.delete(fn);
                return Promise.resolve(result);
            }, reason => {
                sole.delete(fn);
                return Promise.reject(reason);
            }));
        }

        return sole.get(fn);
    },

    createSearchParams(obj, former) {
        let searchParams = new URLSearchParams(former);

        if (obj) {
            for (let [key, value] of Object.entries(obj)) {
                searchParams.set(key, value);
            }
        }

        return searchParams;
    },

    createURL(url, obj) {
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

        while (len--) {
            buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
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
        });
    },

    checkImageURL(str, force) {
        try {
            let url = new URL(str);
            if (force) {
                return true;
            } else {
                return !url.origin.includes(Weibo.rootZone);
            }
        } catch (e) {
            return false;
        }
    },

    writeToClipboard(text, doneCallback, failCallback) {
        let pre = document.createElement("pre");
        let range = document.createRange();
        let selection = document.getSelection();

        pre.textContent = text;
        document.body.append(pre);
        range.selectNodeContents(pre);
        selection.removeAllRanges();
        selection.addRange(range);
        if (document.execCommand("copy")) {
            typeof doneCallback === "function" && doneCallback();
        } else {
            typeof failCallback === "function" && failCallback();
        }
        pre.remove();
    },

};
