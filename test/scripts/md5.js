/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {md5, hmac_md5} from "../../source/scripts/sharre/md5.js";

/**
 * @see A.5 Test suite of http://www.ietf.org/rfc/rfc1321.txt
 */
console.assert(md5("") === "d41d8cd98f00b204e9800998ecf8427e");
console.assert(md5("a") === "0cc175b9c0f1b6a831c399e269772661");
console.assert(md5("abc") === "900150983cd24fb0d6963f7d28e17f72");
console.assert(md5("message digest") === "f96b697d7cb7938d525a2f31aaf161d0");
console.assert(md5("abcdefghijklmnopqrstuvwxyz") === "c3fcd3d76192e4007dfb496cca67e13b");
console.assert(md5("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") === "d174ab98d277d9f5a5611c2c9f419d9f");
console.assert(md5("12345678901234567890123456789012345678901234567890123456789012345678901234567890") === "57edf4a22be3c955ac49da2e2107b67a");

/**
 * @desc Expected result generated by `hash_hmac` function in php
 */
console.assert(hmac_md5("123", "") === "c8ec4ed8338e4d0a81e75ba3b9d290a8");
console.assert(hmac_md5("abc", "1") === "32f10edb98f74d4d80086a7762960a12");
console.assert(hmac_md5("", "a") === "e42235ff5af2c1446a3957f5b380fe06");
console.assert(hmac_md5("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "Ar5g") === "3cb1b5e15a42fbd76cc120318d05e6b5");
console.assert(hmac_md5("12345678901234567890123456789012345678901234567890123456789012345678901234567890", "ds[-23vdw") === "6f378135d6fb61202b5a4b23cf01111a");

console.log("md5 tested.");