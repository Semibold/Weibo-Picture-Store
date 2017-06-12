/**
 * Utils
 */
const Utils = {

    [Symbol.for("lone")]: new Map(),

    noop() {},

    checkURL(maybeURL) {
        try {
            new URL(maybeURL);
            return true;
        } catch (e) {
            console.warn(e.message);
            return false;
        }
    },

    fetch(input, init) {
        return fetch(input, this.blendParams(init));
    },

    singleton(fn, ...params) {
        let lone = this[Symbol.for("lone")];

        if (!lone.has(fn)) {
            let promise = fn(...params)
                .then(result => {
                    lone.delete(fn);
                    return Promise.resolve(result);
                }, reason => {
                    lone.delete(fn);
                    return Promise.reject(reason);
                });
            lone.set(fn, promise);
        }

        return lone.get(fn);
    },

    createURL(url, param) {
        let base = new URL(url);
        let searchParams = this.createSearchParams(param, base.search);
        base.search = searchParams.toString();
        return base.href;
    },

    createSearchParams(param, init) {
        let searchParams = new URLSearchParams(init);
        if (param) {
            for (let [key, value] of Object.entries(param)) {
                searchParams.set(key, value);
            }
        }
        return searchParams;
    },

    blendParams(param) {
        return Object.assign({
            method: "GET",
            mode: "cors",
            credentials: "include",
            cache: "no-cache",
            redirect: "follow",
            referrer: "client",
        }, param);
    },

    parseHTML(html) {
        let parser = new DOMParser();
        let context = parser.parseFromString(html, "text/html");
        let children = context.body.children;
        let fragment = new DocumentFragment();
        fragment.append(...children);
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

    bufferFromBase64(base64) {
        let [head, body = ""] = base64.split(",");
        let byteSequence = atob(body);
        let bufferView = new Uint8Array(byteSequence.length);

        for (let i = 0; i < byteSequence.length; i++) {
            bufferView[i] = byteSequence.codePointAt(i);
        }

        return bufferView.buffer;
    },

    /**
     * image type pattern matching algorithm
     */
    isPatternMatch(buffer, item) {
        let input = new Uint8Array(buffer);
        let {pattern, mask, ignored} = item;

        if (input.length < pattern.length) {
            return false;
        }

        let s = 0;

        while (s < input.length) {
            if (!ignored.includes(input[s])) {
                break;
            }
            s++;
        }

        let p = 0;

        while (p < pattern.length) {
            let maskedData = input[s] & mask[p];
            if (maskedData !== pattern[p]) {
                return false;
            }
            s++;
            p++;
        }

        return true;
    },

    parseMimeType(buffer) {
        for (let item of BITMAP_PATTERN_TABLE) {
            if (this.isPatternMatch(buffer, item)) {
                return item.type;
            }
        }
        return ""; // UNKNOW_BITMAP_MIME_TYPE;
    },

};
