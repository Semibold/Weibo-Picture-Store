/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

/**
 * @readonly
 */
class InternalConf {

  static get headroom() {
    return {
      selectindex: 0,
      maximumsize: 10,
      syncdata: false,
    };
  }

  static get weibo_com() {
    return {
      selectbtn: {disabled: false},
      updatebtn: {disabled: true},
      saveasbtn: {disabled: true},
      deletebtn: {disabled: true},
    };
  }

  static get tencent_com() {
    return {
      selectbtn: {disabled: false},
      updatebtn: {disabled: false},
      saveasbtn: {disabled: false},
      deletebtn: {disabled: true},
    };
  }

  static get qiniu_com() {
    return {
      selectbtn: {disabled: true},
      updatebtn: {disabled: false},
      saveasbtn: {disabled: false},
      deletebtn: {disabled: true},
    };
  }

  static get aliyun_com() {
    return {
      selectbtn: {disabled: true},
      updatebtn: {disabled: false},
      saveasbtn: {disabled: false},
      deletebtn: {disabled: true},
    };
  }

  static get upyun_com() {
    return {
      selectbtn: {disabled: true},
      updatebtn: {disabled: false},
      saveasbtn: {disabled: false},
      deletebtn: {disabled: true},
    };
  }

}


/**
 * @readonly
 */
export class Config {

  /**
   * @return {string} - 固定值
   */
  static get trackId() {
    return "since-20170309";
  }

  /**
   * @desc 微相册的唯一标识符：64 位特征码（固定值）
   * @return {string}
   */
  static get microAlbumId() {
    return "ImUfrNWhuFTTOXASFgdCVVv2ZUIquXrKjqiey2r95Kqudh6sjaBUWFdcwtlGEX2w";
  }

  /**
   * @enum
   * @desc Storage Service Provider Type (as identity)
   * @return {string[]}
   */
  static get sspt() {
    return [
      "weibo_com",
      "tencent_com",
      "qiniu_com",
      "aliyun_com",
      "upyun_com",
    ];
  }

  /**
   * @return {number}
   */
  static get selectindex() {
    return InternalConf.headroom.selectindex;
  }

  /**
   * @return {Object}
   */
  static get syncdata() {
    return InternalConf.headroom.syncdata;
  }

  /**
   * @return {Object}
   */
  static get ssptdata() {
    return Config.sspt.reduce((r, x) => Object.assign(r, {[x]: InternalConf[x]}), {});
  }

}