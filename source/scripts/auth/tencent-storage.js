/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";
import {hash_hmac} from "../sharre/hash-hmac.js";
import {Config} from "../sharre/config.js";

/**
 * @desc 按顺序调用
 * @desc 参与签名计算的字符建议使用小写字母和URL安全字符，否则可能无法通过签名校验
 * @desc [fix] - 代表已知问题（官方文档没有说明），并且内部修复了这些问题
 * @desc [nofix] - 代表已知问题（官方文档没有说明），但是内部没有修复这些问题
 * @desc based on Tencent COS version 4
 * @see https://cloud.tencent.com/document/product/436/7778
 */
export class TencentStorageAuth {

  /**
   * @param {string} ak - AccessKey (alias: SecretId)
   * @param {string} sk - SecretKey
   */
  constructor(ak, sk) {
    this.auths = {accessKey: ak, secretKey: sk};
    this.authParams = new URLSearchParams();
  }

  /**
   * @public
   * @param {string} method - http method
   * @param {string} path - include query string
   * @param {string} host - It's a host. (without protocol and path)
   * @param {string} [protocol = "http:"]
   * @return {TencentStorageAuth}
   */
  setRequestInfo(method, path, host, protocol = "http:") {
    this.auths.method = method.toLowerCase();
    this.auths.path = path.toLowerCase();
    this.auths.host = host.toLowerCase();
    this.auths.protocol = protocol.toLowerCase();
    this.auths.url = new URL(path, `${this.auths.protocol}//${this.auths.host}`);
    return this;
  }

  /**
   * @public
   * @desc 目前仅支持 sha1，传入参数自动忽略
   * @param {string} [algo = "sha1"]
   * @return {TencentStorageAuth}
   */
  setAlgo(algo = "sha1") {
    this.auths.algo = "sha1";
    return this;
  }

  /**
   * @public
   * @param {number} [persistSeconds = 600]
   * @return {TencentStorageAuth}
   */
  setSignTime(persistSeconds = 600) {
    this.auths.stime = Utils.time();
    this.auths.etime = this.auths.stime + persistSeconds;
    return this;
  }

  /**
   * @public
   * @desc 不建议传参，保持默认
   * @param {Object} [headers]
   * @return {TencentStorageAuth}
   */
  setHeaderList(headers = {host: this.auths.host}) {
    this.auths.headers = headers;
    return this;
  }

  /**
   * @public
   * @desc 不建议传参，保持默认
   * @param {Object} [urlparams]
   * @return {TencentStorageAuth}
   */
  setURLParamList(urlparams = {_tracker: Config.trackId}) {
    this.auths.urlparams = urlparams;

    // autoupdate url info
    for (const [k, v] of Object.entries(this.auths.urlparams)) {
      // 参与签名的 value，在 querystring 中必须使用 lowercase [fix]
      // 虽然 key 无此要求，但是建议使用 lowercase [nofix]
      this.auths.url.searchParams.set(k, v.toLowerCase());
    }

    return this;
  }

  /**
   * @public
   * @async
   * @desc generate signature and return headers.
   * @return {Promise<Headers>}
   */
  async generateHeaders() {
    const signTime = `${this.auths.stime};${this.auths.etime}`;
    const signKey = await hash_hmac("sha-1", signTime, this.auths.secretKey);
    const httpParams = [];
    const httpHeaders = [];
    for (const [k, v] of Object.entries(this.auths.urlparams)) {
      // value 需要使用 urlencode，否则有特殊字符时，签名不通过 [fix]
      // key 如果含有URL不安全字符，无论其是否经过 urlencode，签名都不通过 [nofix]
      httpParams.push(`${k.toLowerCase()}=${encodeURIComponent(v.toLowerCase())}`);
    }
    for (const [k, v] of Object.entries(this.auths.headers)) {
      // value 需要使用 lowercase，含有 uppercase 时签名不通过 [nofix]
      httpHeaders.push(`${k.toLowerCase()}=${encodeURIComponent(v)}`);
    }
    const httpStr = [
      this.auths.method,
      this.auths.url.pathname,
      httpParams.sort().join("&"),
      httpHeaders.sort().join("&"),
    ].join("\n") + "\n";
    const buffer = await crypto.subtle.digest("sha-1", Utils.bufferFromText(httpStr));
    const httpStrSha1ed = Utils.hexitFromBuffer(buffer);
    const str2sign = [this.auths.algo, signTime, httpStrSha1ed].join("\n") + "\n";
    const sign = await hash_hmac("sha-1", str2sign, signKey);
    const headers = new Headers(this.auths.headers);
    this.authParams.set("q-sign-algorithm", this.auths.algo);
    this.authParams.set("q-ak", this.auths.accessKey);
    this.authParams.set("q-sign-time", signTime);
    this.authParams.set("q-key-time", signTime);
    this.authParams.set("q-header-list", Object.keys(this.auths.headers).map(x => x.toLowerCase()).sort().join(";"));
    this.authParams.set("q-url-param-list", Object.keys(this.auths.urlparams).map(x => x.toLowerCase()).sort().join(";"));
    this.authParams.set("q-signature", sign);

    // URLSearchParams.toString(); 会生成安全的 querystring
    // Authorization 不需要 urlencode，因此需要使用 urldecode
    headers.set("Authorization", decodeURIComponent(this.authParams.toString()));

    return headers;
  }

  /**
   * @public
   * @async
   * @desc Simplify. Invoke above functions if you want to customize params.
   * @param {string} method - http method
   * @param {string} path - include query string
   * @param {string} host - It's a host. (without protocol and path)
   * @param {string} [protocol = "http:"]
   * @return {Promise<Headers>}
   */
  async getAuthHeaders(method, path, host, protocol = "http:") {
    this.setRequestInfo(method, path, host, protocol);
    this.setAlgo().setSignTime().setHeaderList().setURLParamList();
    return await this.generateHeaders();
  }
  
}