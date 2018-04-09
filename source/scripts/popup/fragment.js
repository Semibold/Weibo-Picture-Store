/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../sharre/utils.js";

const headHTML = `
  <div class="head-setting">
    <div class="head-network-protocol">
      <label title="使用http协议">
        <input type="radio" name="scheme" value="1">
        <span>http</span>
      </label>
      <label title="使用https协议">
        <input type="radio" name="scheme" value="2">
        <span>https</span>
      </label>
      <label title="使用相对协议">
        <input type="radio" name="scheme" value="3">
        <span>自适应</span>
      </label>
    </div>
    <div class="head-split-line"></div>
    <div class="head-clipsize">
      <label title="使用原始图片">
        <input type="radio" name="clipsize" value="1">
        <span>原图</span>
      </label>
      <label title="中等裁剪尺寸">
        <input type="radio" name="clipsize" value="2">
        <span>中等尺寸</span>
      </label>
      <label title="缩略图裁剪尺寸">
        <input type="radio" name="clipsize" value="3">
        <span>缩略图</span>
      </label>
      <label title="自定义裁剪尺寸">
        <input type="radio" name="clipsize" value="4">
        <input type="text" placeholder="输入自定义尺寸" spellcheck="false" autocomplete="off" class="custom-clipsize">
      </label>
    </div>
  </div>
  <div class="head-feature">
    <a class="head-copy-mode" title="切换复制模式"><i class="fa fa-times"></i><i class="fa fa-check"></i></a>
    <a class="head-browsing-history" title="查看上传记录"><i class="fa fa-history"></i></a>
  </div>`;

document.getElementById("head").append(Utils.parseHTML(headHTML));
