/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

// popup 单条数据的结构示例
export const popupItem = {
  pid: "图片标识符(without protocol and host)",
  sspt: "weibo_com",
  blob: "[File|Blob]",
  buffer: "[ArrayBuffer]",
  readType: "arrayBuffer",

  // 各种类型独有的属性
  // ...

  // 后续追加的数据
  URL: "",
  HTML: "",
  UBB: "",
  Markdown: "",
};