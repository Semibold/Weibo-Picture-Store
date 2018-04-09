/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Base64} from "../vendor/base64.js";

export class Utils {

  /**
   * @readonly
   */
  static noop() {}

  /**
   * @param {number} [future = 0] - Second time
   * @return {number} - Second time
   */
  static time(future = 0) {
    return Math.floor(Date.now() / 1000) + future;
  }

  /**
   * @async
   * @param {RequestInfo} input
   * @param {RequestInit} [init]
   * @return {Promise<Response>}
   */
  static fetch(input, init) {
    return fetch(input, Object.assign({
      method: "GET",
      mode: "cors",
      credentials: "include",
      cache: "default",
      redirect: "follow",
      referrer: "client",
    }, init));
  }

  /**
   * @param {string} maybeURL
   * @return {boolean}
   */
  static isValidURL(maybeURL) {
    try {
      new URL(maybeURL);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @param {string} url
   * @param {Object} [param]
   * @return {string}
   */
  static buildURL(url, param) {
    const base = new URL(url);
    const searchParams = this.createSearchParams(param, base.search);
    base.search = searchParams.toString();
    return base.href;
  }

  /**
   * @param {Object} [param]
   * @param {string|URLSearchParams} [init]
   * @return {URLSearchParams}
   */
  static createSearchParams(param, init) {
    const searchParams = new URLSearchParams(init);
    if (param) {
      for (const [key, value] of Object.entries(param)) {
        searchParams.set(key, value);
      }
    }
    return searchParams;
  }

  /**
   * @param {string} html
   * @return {DocumentFragment}
   */
  static parseHTML(html) {
    const parser = new DOMParser();
    const context = parser.parseFromString(html, "text/html");
    const children = context.body.children;
    const fragment = new DocumentFragment();
    fragment.append(...children);
    return fragment;
  }

  /**
   * @param {number} n
   * @return {string}
   */
  static randomString(n = 0) {
    const buffer = [];
    const charPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    while (n--) {
      buffer.push(charPool[Math.floor(Math.random() * charPool.length)]);
    }

    return buffer.join("");
  }

  /**
   * @desc Be Careful: It's not equal to TextEncoder.encode();
   * @param {string} byteSequence
   * @param {boolean} [base64 = false]
   * @return {Uint8Array}
   */
  static bufferFromText(byteSequence = "", base64 = false) {
    if (base64) return Base64.toBuffer(byteSequence);
    return Uint8Array.from([...byteSequence], char => char.codePointAt(0));
  }

  /**
   * @desc Be Careful: It's not equal to TextDecoder.decode();
   * @param {ArrayBufferLike} buffer
   * @param {boolean} [base64 = false]
   * @return {string}
   */
  static textFromBuffer(buffer, base64 = false) {
    if (base64) return Base64.fromBuffer(buffer);
    const bufferView = new Uint8Array(buffer);
    return String.fromCodePoint(...bufferView);
  }

  /**
   * @param {ArrayBufferLike[]} list
   * @return {Uint8Array}
   */
  static bufferConcat(list) {
    const totalLength = list.reduce((pv, cv) => pv + cv.byteLength, 0);
    const bufferView = new Uint8Array(totalLength);
    list.reduce((pv, cv) => {
      bufferView.set(new Uint8Array(cv), pv);
      return pv + cv.byteLength;
    }, 0);
    return bufferView;
  }

  /**
   * @param {ArrayBufferLike} buffer
   * @return {string} - Lowercase hexits
   */
  static hexitFromBuffer(buffer) {
    const bv = new Uint8Array(buffer);
    return [...bv].map(x => x.toString(16).padStart(2, "0")).join("").toLowerCase();
  }

}
