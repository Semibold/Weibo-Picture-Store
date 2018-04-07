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
      syncdata: false,
      inactived: {
        weibo_com: false,
        tencent_com: false,
        qiniu_com: true,
        aliyun_com: true,
        upyun_com: true,
      },
      furtherer: {
        updatebtn: {disabled: false},
        saveasbtn: {disabled: false},
        deletebtn: {disabled: false},
      },
      predefine: {
        weibo_com: {
          updatebtn: {disabled: true},
          saveasbtn: {disabled: true},
          deletebtn: {disabled: true},
        },
        tencent_com: {
          updatebtn: {disabled: false},
          saveasbtn: {disabled: false},
          deletebtn: {disabled: true},
        },
        qiniu_com: {
          updatebtn: {disabled: false},
          saveasbtn: {disabled: false},
          deletebtn: {disabled: true},
        },
        aliyun_com: {
          updatebtn: {disabled: false},
          saveasbtn: {disabled: false},
          deletebtn: {disabled: true},
        },
        upyun_com: {
          updatebtn: {disabled: false},
          saveasbtn: {disabled: false},
          deletebtn: {disabled: true},
        },
      },
      structure: {
        weibo_com: {
          sspt: "weibo_com",
        },
        tencent_com: {
          sspt: "tencent_com",
          mark: "",
          akey: "",
          skey: "",
          host: "",
          path: "",
        },
        qiniu_com: {
          sspt: "qiniu_com",
        },
        aliyun_com: {
          sspt: "aliyun_com",
        },
        upyun_com: {
          sspt: "upyun_com",
        },
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
   * @desc 微相册的唯一标识符：64 位特征码（固定值）
   * @return {string}
   */
  static get microAlbumId() {
    return "ImUfrNWhuFTTOXASFgdCVVv2ZUIquXrKjqiey2r95Kqudh6sjaBUWFdcwtlGEX2w";
  }

  /**
   * @desc 最大的数据长度（固定值）
   * @return {number}
   */
  static get listmaxlength() {
    return 12;
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

  static get inactived() {
    return InternalConf.headroom.inactived;
  }

  static get selectindex() {
    return InternalConf.headroom.selectindex;
  }

  static get syncdata() {
    return InternalConf.headroom.syncdata;
  }

  static get furtherer() {
    return InternalConf.headroom.furtherer;
  }

  static get predefine() {
    return InternalConf.headroom.predefine;
  }

  static get ssptdata() {
    return InternalConf.headroom.structure;
  }

}