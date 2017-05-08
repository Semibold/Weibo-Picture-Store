/**
 * Utils
 */
const Utils = {

    [Symbol.for("guid")]: 1,
    [Symbol.for("sole")]: new Map(),

    noop() {},

    guid() {
        return String(this[Symbol.for("guid")]++);
    },

    fetch(url, obj) {
        return fetch(url, this.blendParams(obj));
    },

    fetchBlob(url) {
        return this.fetch(url, {
            credentials: "omit",
        }).then(response => {
            return response.ok ? response.blob() : Promise.reject();
        });
    },

    checkURL(maybeURL) {
        try {
            new URL(maybeURL);
            return true;
        } catch (e) {
            return false;
        }
    },

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
        return Object.assign({
            method: "GET",
            mode: "cors",
            credentials: "include",
            cache: "no-cache",
            redirect: "follow",
            referrer: "client",
        }, obj);
    },

    parseHTML(html) {
        let parser = new DOMParser();
        let context = parser.parseFromString(html, "text/html");
        let children = context.body.children;
        let fragment = new DocumentFragment();

        for (let i = children.length; i > 0; i--) {
            fragment.prepend(children[i - 1]);
        }

        return fragment;
    },

    randomString(n) {
        let buffer = [];
        let length = Math.abs(n) || 0;
        let charPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        while (length--) {
            buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
        }

        return buffer.join("");
    },

    writeToClipboard(content, doneCallback, failCallback) {
        let range = document.createRange();
        let selection = document.getSelection();
        let container = document.createElement("pre");

        container.textContent = content;
        document.body.append(container);
        range.selectNodeContents(container);
        selection.removeAllRanges();
        selection.addRange(range);
        if (document.execCommand("copy")) {
            typeof doneCallback === "function" && doneCallback();
        } else {
            typeof failCallback === "function" && failCallback();
        }
        container.remove();
    },

};
