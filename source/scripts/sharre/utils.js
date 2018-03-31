/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Base64} from "./base64.js";

export class Utils {

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

}