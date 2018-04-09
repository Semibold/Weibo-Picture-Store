/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

interface URLData {
  URL: string;
  HTML: string;
  UBB: string;
  Markdown: string;
}

/**
 * @desc Popup 弹窗单条数据的结构
 */
interface PopupItem extends URLData {
  ssp: string;
  pid: string;
  host: string;
  blob: Blob | File;
  buffer: ArrayBufferLike;
  readType: string;
}
