/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "./utils.js";

/**
 * @static
 * @see https://github.com/beatgammit/base64-js
 * @desc Based on 1.2.3. Modified for this project.
 */
export class Base64 {
    /**
     * @private
     * @return {Object}
     */
    static get codeTable() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        const lookup = [];
        const revlookup = [];

        for (let i = 0; i < chars.length; i++) {
            lookup[i] = chars[i];
            revlookup[chars.charCodeAt(i)] = i;
        }

        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        revlookup["-".charCodeAt(0)] = 62;
        revlookup["_".charCodeAt(0)] = 63;

        return { lookup, revlookup };
    }

    /**
     * @private
     * @param {string} b64
     * @return {number}
     */
    static placeholdersCount(b64) {
        const len = b64.length;
        if (len % 4 > 0) {
            throw new Error("Invalid string. Length must be a multiple of 4");
        }

        // the number of equal signs (place holders)
        // if there are two placeholders, than the two characters before it
        // represent one byte
        // if there is only one, then the three characters before it represent 2 bytes
        // this is just a cheap hack to not do indexOf twice
        return b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
    }

    /**
     * @private
     * @param {number} num
     * @return {string}
     */
    static triplet(num) {
        const { lookup } = Base64.codeTable;
        return lookup[(num >> 18) & 0x3f] + lookup[(num >> 12) & 0x3f] + lookup[(num >> 6) & 0x3f] + lookup[num & 0x3f];
    }

    /**
     * @private
     * @param {ArrayBufferLike|ArrayLike<number>|TypedArray} buffer
     * @param {number} start
     * @param {number} end
     * @return {string}
     */
    static encodeChunk(buffer, start, end) {
        const output = [];
        const bv = new Uint8Array(buffer);
        for (let i = start; i < end; i += 3) {
            const t = ((bv[i] << 16) & 0xff0000) + ((bv[i + 1] << 8) & 0xff00) + (bv[i + 2] & 0xff);
            output.push(Base64.triplet(t));
        }
        return output.join("");
    }

    /**
     * @public
     * @desc Decodes data encoded with MIME base64.
     * @param {string} base64
     * @return {string}
     */
    static decode(base64 = "") {
        const bufferView = Base64.toBuffer(base64);
        return Utils.textFromBuffer(bufferView);
    }

    /**
     * @public
     * @desc Encodes data with MIME base64.
     * @param {string} text
     * @return {string}
     */
    static encode(text = "") {
        const buffer = Utils.bufferFromText(text);
        return Base64.fromBuffer(buffer);
    }

    /**
     * @public
     * @param {ArrayBufferLike|ArrayLike<number>|TypedArray} buffer
     * @return {string}
     */
    static fromBuffer(buffer) {
        const { lookup } = Base64.codeTable;
        const bv = new Uint8Array(buffer);
        const len = bv.byteLength;
        const extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
        const tripletLength = len - extraBytes;
        const maxChunkLength = 16383; // must be multiple of 3
        const parts = [];
        const output = [];

        // go through the array every three bytes, we"ll deal with trailing stuff later
        for (let i = 0; i < tripletLength; i += maxChunkLength) {
            parts.push(
                Base64.encodeChunk(bv, i, i + maxChunkLength > tripletLength ? tripletLength : i + maxChunkLength),
            );
        }

        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
            const t = bv[len - 1];
            output.push(lookup[t >> 2]);
            output.push(lookup[(t << 4) & 0x3f]);
            output.push("==");
        } else if (extraBytes === 2) {
            const t = (bv[len - 2] << 8) + bv[len - 1];
            output.push(lookup[t >> 10]);
            output.push(lookup[(t >> 4) & 0x3f]);
            output.push(lookup[(t << 2) & 0x3f]);
            output.push("=");
        }

        parts.push(output.join(""));
        return parts.join("");
    }

    /**
     * @public
     * @param {string} b64
     * @return {Uint8Array}
     */
    static toBuffer(b64) {
        const { revlookup } = Base64.codeTable;
        const len = b64.length;
        const placeholders = Base64.placeholdersCount(b64);
        const bv = new Uint8Array((len * 3) / 4 - placeholders);

        // if there are placeholders, only get up to the last complete 4 chars
        const l = placeholders > 0 ? len - 4 : len;

        let i,
            z = 0;

        for (i = 0; i < l; i += 4) {
            const a = revlookup[b64.charCodeAt(i)] << 18;
            const b = revlookup[b64.charCodeAt(i + 1)] << 12;
            const c = revlookup[b64.charCodeAt(i + 2)] << 6;
            const d = revlookup[b64.charCodeAt(i + 3)];
            const t = a | b | c | d;
            bv[z++] = (t >> 16) & 0xff;
            bv[z++] = (t >> 8) & 0xff;
            bv[z++] = t & 0xff;
        }

        if (placeholders === 2) {
            const a = revlookup[b64.charCodeAt(i)] << 2;
            const b = revlookup[b64.charCodeAt(i + 1)] >> 4;
            const t = a | b;
            bv[z++] = t & 0xff;
        } else if (placeholders === 1) {
            const a = revlookup[b64.charCodeAt(i)] << 10;
            const b = revlookup[b64.charCodeAt(i + 1)] << 4;
            const c = revlookup[b64.charCodeAt(i + 2)] >> 2;
            const t = a | b | c;
            bv[z++] = (t >> 8) & 0xff;
            bv[z++] = t & 0xff;
        }

        return bv;
    }

    /**
     * @public
     * @param {string} b64
     * @return {number}
     */
    static byteLength(b64) {
        // base64 is 4/3 + up to two characters of the original data
        return (b64.length * 3) / 4 - Base64.placeholdersCount(b64);
    }
}
