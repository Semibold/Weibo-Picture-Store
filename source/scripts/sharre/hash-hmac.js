/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */
import {Utils} from "./utils.js";

/**
 * @async
 * @desc like `hash_hmac` function in php, but supported algorithms maybe different.
 * @see http://php.net/manual/en/function.hash-hmac.php
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
 * @param {string} algo - Name of selected hashing algorithm.
 * @param {string} data - Message to be hashed.
 * @param {string} key - Shared secret key used for generating the HMAC variant of the message digest.
 * @param {boolean} [raw_output] - When set to TRUE, outputs raw binary data. FALSE outputs lowercase hexits.
 * @return {Promise<string>}
 */
export async function hash_hmac(algo, data, key, raw_output = false) {
  const ik = await crypto.subtle.importKey("raw", Utils.bufferFromText(key), {
    name: "hmac",
    hash: {name: algo},
  }, false, ["sign", "verify"]);
  const sign = await crypto.subtle.sign("hmac", ik, Utils.bufferFromText(data));
  if (raw_output) {
    return Utils.textFromBuffer(sign);
  } else {
    return [...new Uint8Array(sign)].map(num => num.toString(16).padStart(2, "0")).join("");
  }
}