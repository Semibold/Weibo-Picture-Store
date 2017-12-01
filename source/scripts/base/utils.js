import {
    SINGLETON_MODULE,
    BITMAP_PATTERN_TABLE,
    UNKNOW_BITMAP_MIME_TYPE,
} from "./constant.js";
import {Weibo} from "./boot.js";

export class Utils {

    static noop() {}

    static fetch(input, init) {
        return fetch(input, Object.assign({
            method: "GET",
            mode: "cors",
            credentials: "include",
            cache: "no-cache",
            redirect: "follow",
            referrer: "client",
        }, init));
    }

    static isValidURL(maybeURL) {
        try {
            new URL(maybeURL);
            return true;
        } catch (e) {
            console.warn(e.message);
            return false;
        }
    }

    static singleton(func) {
        if (!SINGLETON_MODULE.has(func)) {
            const promise = func().then(result => {
                SINGLETON_MODULE.delete(func);
                return Promise.resolve(result);
            }).catch(reason => {
                SINGLETON_MODULE.delete(func);
                return Promise.reject(reason);
            });
            SINGLETON_MODULE.set(func, promise);
        }
        return SINGLETON_MODULE.get(func);
    }

    static buildURL(url, param) {
        const base = new URL(url);
        const searchParams = this.createSearchParams(param, base.search);
        base.search = searchParams.toString();
        return base.href;
    }

    static createSearchParams(param, init) {
        const searchParams = new URLSearchParams(init);
        if (param) {
            for (const [key, value] of Object.entries(param)) {
                searchParams.set(key, value);
            }
        }
        return searchParams;
    }

    static parseHTML(html) {
        const parser = new DOMParser();
        const context = parser.parseFromString(html, "text/html");
        const children = context.body.children;
        const fragment = new DocumentFragment();
        fragment.append(...children);
        return fragment;
    }

    static randomString(n = 0) {
        const buffer = [];
        const charPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        while (n--) {
            buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
        }

        return buffer.join("");
    }

    static writeToClipboard(content, doneCallback, failCallback) {
        const range = document.createRange();
        const selection = document.getSelection();
        const container = document.createElement("pre");

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
    }

    static bufferFromBase64(base64 = "") {
        const byteSequence = atob(base64);
        const bufferView = new Uint8Array(byteSequence.length);

        for (let i = 0; i < byteSequence.length; i++) {
            bufferView[i] = byteSequence.codePointAt(i);
        }

        return bufferView.buffer;
    }

    /**
     * image type pattern matching algorithm
     */
    static isPatternMatch(buffer, item) {
        const input = new Uint8Array(buffer);
        const {pattern, mask, ignored} = item;

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
            const maskedData = input[s] & mask[p];
            if (maskedData !== pattern[p]) {
                return false;
            }
            s++;
            p++;
        }

        return true;
    }

    static parseMimeType(buffer) {
        for (const item of BITMAP_PATTERN_TABLE) {
            if (this.isPatternMatch(buffer, item)) {
                return item.type;
            }
        }
        return UNKNOW_BITMAP_MIME_TYPE;
    }

    static sharre(func) {
        if (chrome.extension.getBackgroundPage() !== self) {
            throw new Error("Illegal Invoke");
        }
        if (!func.name) {
            throw new Error("Invalid Params");
        }
        if (Weibo[func.name]) {
            throw new Error("Function has been registered");
        }
        Weibo[func.name] = func;
    }

}
