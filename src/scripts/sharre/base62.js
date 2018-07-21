/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @static
 * @see https://github.com/andrew/base62.js
 * @desc Based on 2.0.0. Modified for this project.
 */
export class Base62 {

    /**
     * @private
     * @return {Object}
     */
    static get codeTable() {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const table = chars
            .split("")
            .reduce((ac, cv, i) => {
                ac[cv] = i;
                return ac;
            }, {});

        return {chars, table};
    }

    /**
     * @public
     * @param {number} n
     * @return {string}
     */
    static encode(n) {
        const r = [];
        const {chars} = Base62.codeTable;

        if (!Number.isInteger(n)) {
            throw new Error("Arguments must be a valid integer");
        }
        if (n === 0) {
            return chars[n];
        }
        while (n > 0) {
            r.unshift(chars[n % chars.length]);
            n = Math.floor(n / chars.length);
        }
        return r.join("");
    }

    /**
     * @public
     * @param {string} text - ASCII only
     * @return {string}
     */
    static decode(text) {
        const r = [];
        const {chars, table} = Base62.codeTable;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (table[char] == null) {
                throw new Error("Arguments is not a valid string");
            }
            r.push(chars.length ** (text.length - i - 1) * table[char]);
        }

        return r.reduce((ac, cv) => ac + cv, 0).toString();
    }

}
