/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

// 用于初始化 options page 的示例数据结构
// 需要保证结构的完整性，内部操作不会校验属性的存在性
export const userdata = {

  // 顶层配置
  headroom: {
    selectindex: 0,
    syncdata: true,
  },

  // 各种类型配置
  weibo_com: [
    {
      // 每种类型的第一个值必须有这些预定义数据
      // 这些数据来自 config.js
      predefine: {
        selectbtn: {disabled: false},
        updatebtn: {disabled: true},
        saveasbtn: {disabled: true},
        deletebtn: {disabled: true},
      },

      // 因为微博不可配置，所以没有其他数据
    }
  ],
  tencent_com: [
    {
      predefine: {
        selectbtn: {disabled: false},
        updatebtn: {disabled: false},
        saveasbtn: {disabled: false},
        deletebtn: {disabled: true},
      },
      mark: "ahh",
      akey: "ak-1",
      skey: "sk-1",
      host: "test-1.mycloud.com",
      path: "/figure-1"
    },
    {
      // 当前类型的配置数据
      mark: "pic",
      akey: "ak-2",
      skey: "sk-2",
      host: "test-2.mycloud.com",
      path: "/figure-2"
    },
  ],
  qiniu_com: [
    {
      predefine: {
        selectbtn: {disabled: true},
        updatebtn: {disabled: false},
        saveasbtn: {disabled: false},
        deletebtn: {disabled: true},
      },

      // not implemented
      // 没有实现，暂时无法提供数据结构
    }
  ],
  aliyun_com: [
    {
      predefine: {
        selectbtn: {disabled: true},
        updatebtn: {disabled: false},
        saveasbtn: {disabled: false},
        deletebtn: {disabled: true},
      },

      // not implemented
    }
  ],
  upyun_com: [
    {
      predefine: {
        selectbtn: {disabled: true},
        updatebtn: {disabled: false},
        saveasbtn: {disabled: false},
        deletebtn: {disabled: true},
      },

      // not implemented
    }
  ],
};