/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Base64} from "../../source/scripts/plugin/base64.js";

const kdata = [[[0, 0, 0], "AAAA"], [[0, 0, 1], "AAAB"], [[0, 1, -1], "AAH/"], [[1, 1, 1], "AQEB"]];

function isBufferEqual(a, b) {
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < length; ++i) {
        if ((a[i] & 0xFF) !== (b[i] & 0xFF)) return false;
    }
    return true;
}

function map(arr, callback) {
    const res = [];
    for (let k = 0; k < arr.length; k++) {
        if (typeof arr === "string" && !!arr.charAt(k)) {
            const kValue = arr.charAt(k);
            res[k] = callback(kValue, k, arr);
        } else if (typeof arr !== "string" && k in arr) {
            const kValue = arr[k];
            res[k] = callback(kValue, k, arr);
        }
    }
    return res;
}


// decode url-safe style base64 strings
const exp = [0xff, 0xff, 0xbe, 0xff, 0xef, 0xbf, 0xfb, 0xef, 0xff];
const ac1 = Base64.toBuffer("//++/++/++//");
for (let i = 0; i < ac1.byteLength; i++) {
    console.assert(ac1[i] === exp[i]);
}

const ac2 = Base64.toBuffer("__--_--_--__");
for (let i = 0; i < ac2.byteLength; i++) {
    console.assert(ac2[i] === exp[i]);
}


// big data (It takes a long time)
// console.time("base64 big data");
// const big = new Uint8Array(64 * 1024 * 1024);
// for (let i = 0; i < big.byteLength; i++) {
//   big[i] = i % 256;
// }
// const b64 = Base64.fromBuffer(big);
// const buf = Base64.toBuffer(b64);
// console.assert(big.byteLength === buf.length && buf.every((cv, i) => cv === big[i]), "convert big data to base64");
// console.timeEnd("base64 big data");


// convert to base64 and back
const checks = ["a", "aa", "aaa", "hi", "hi!", "hi!!", "sup", "sup?", "sup?!"];
for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    const b64 = Base64.fromBuffer(map(check, char => char.charCodeAt(0)));
    const buf = Base64.toBuffer(b64);
    const str = map(buf, byte => String.fromCharCode(byte)).join("");
    console.assert(check === str, "Checked " + check);
    console.assert(Base64.byteLength(b64) === buf.byteLength, "Checked length for " + check);
}


// convert known data to string
for (let i = 0; i < kdata.length; i++) {
    const bytes = kdata[i][0];
    const expected = kdata[i][1];
    const actual = Base64.fromBuffer(bytes);
    console.assert(actual === expected, `Ensure that ${bytes} serialise to ${expected}`);
}


// convert known data from string
for (let i = 0; i < kdata.length; i++) {
    const expected = kdata[i][0];
    const str = kdata[i][1];
    const actual = Base64.fromBuffer(str);
    console.assert(isBufferEqual(actual, expected), `Ensure that ${str} deserialise to ${expected}`);
}

console.log("base64 tested.");