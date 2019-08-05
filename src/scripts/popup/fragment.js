/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";

// language=HTML
const headHTML = `
    <div class="head-setting">
        <div class="head-network-protocol">
            <label title="使用http协议(全局)">
                <input type="radio" name="scheme" value="1">
                <span>http</span>
            </label>
            <label title="使用https协议(全局)">
                <input type="radio" name="scheme" value="2">
                <span>https</span>
            </label>
            <label title="使用相对协议(全局)">
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
                <input list="custom-clipsize-list" type="text" placeholder="输入自定义尺寸" spellcheck="false" autocomplete="on" class="custom-clipsize">
            </label>
            <datalist id="custom-clipsize-list">
                <option value="wap800">800 像素宽度原比例缩放</option>
                <option value="wap720">720 像素宽度原比例缩放</option>
                <option value="wap360">360 像素宽度原比例缩放</option>
                <option value="wap240">240 像素宽度原比例缩放</option>
                <option value="wap180">180 像素宽度原比例缩放</option>
                <option value="wap50">50 像素宽度原比例缩放</option>
                <option value="bmiddle">440 像素宽度原比例缩放</option>
                <option value="small">200 像素宽度原比例缩放</option>
                <option value="thumb300">300 像素正方形裁剪</option>
                <option value="thumb180">180 像素正方形裁剪</option>
                <option value="thumb150">150 像素正方形裁剪</option>
                <option value="square">80 像素正方形裁剪</option>
            </datalist>
        </div>
    </div>
    <div class="head-feature">
        <a class="head-copy-mode" title="切换复制模式"><i class="fa fa-circle-o"></i><i class="fa fa-check-circle-o"></i></a>
        <a class="head-browsing-history" title="查看上传记录"><i class="fa fa-history"></i></a>
    </div>`;

// language=HTML
const footHTML = `
    <div class="foot-bottom">
        <i class="fa fa-angle-double-left"></i>
        <div class="foot-menu">
            <a href="${chrome.i18n.getMessage("project_issue")}" target="_blank" title="通过GitHub反馈问题">GitHub</a>
            <a href="mailto:${chrome.i18n.getMessage("author_email")}" title="通过电子邮件反馈问题">反馈</a>
            <a href="${chrome.i18n.getMessage(
                "project_donate",
            )}" target="_blank" title="扩展很棒，捐赠以表支持 +1s">捐赠</a>
            <a href="${chrome.i18n.getMessage(
                "project_readme",
            )}" target="_blank" title="操作指南及更新日志">更新日志</a>
        </div>
    </div>`;

document.getElementById("head").append(Utils.parseHTML(headHTML));
document.getElementById("foot").append(Utils.parseHTML(footHTML));
