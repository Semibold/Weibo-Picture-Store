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
      syncdata: {
        checked: false,
        disabled: false,
      },
    };
  }

  static get weibo_com() {
    return {
      name: chrome.i18n.getMessage("ssp_weibo_com_name"),
      selectmenu: {
        visible: true,
        disabled: true,
      },
      imageonly: {
        checked: true,
        disabled: true,
      },
      dirpath: {
        value: "",
        disabled: true,
      },
    };
  }

  static get tencent_com() {
    return {
      name: chrome.i18n.getMessage("ssp_tencent_com_name"),
      selectmenu: {
        visible: true,
        disabled: false,
      },
      imageonly: {
        checked: true,
        disabled: true,
      },
      dirpath: {
        value: "",
        disabled: false,
      },
    };
  }

  static get qiniu_com() {
    return {
      name: chrome.i18n.getMessage("ssp_qiniu_com_name"),
      selectmenu: {
        visible: false,
        disabled: true,
      },
      imageonly: {
        checked: true,
        disabled: true,
      },
      dirpath: {
        value: "",
        disabled: false,
      },
    };
  }

  static get aliyun_com() {
    return {
      name: chrome.i18n.getMessage("ssp_aliyun_com_name"),
      selectmenu: {
        visible: false,
        disabled: true,
      },
      imageonly: {
        checked: true,
        disabled: true,
      },
      dirpath: {
        value: "",
        disabled: false,
      },
    };
  }

  static get upyun_com() {
    return {
      name: chrome.i18n.getMessage("ssp_upyun_com_name"),
      selectmenu: {
        visible: false,
        disabled: true,
      },
      imageonly: {
        checked: true,
        disabled: true,
      },
      dirpath: {
        value: "",
        disabled: false,
      },
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