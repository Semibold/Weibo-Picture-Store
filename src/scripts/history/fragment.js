/*
 * Copyright (c) 2018 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import { Utils } from "../sharre/utils.js";

// language=HTML
const headHTML = `
    <h1>
        <span><i class="fa fa-paragraph"></i></span>
        <span>上传记录</span>
        <span>
            <a class="navi-prev" data-disabled="true" title="之前的相册"><i class="fa fa-chevron-left"></i></a>
            <a class="navi-poam" data-disabled="true" title="前往微相册管理相册中的图片(外部链接)" target="_blank">
                <i class="fa fa-picture-o"></i>
            </a>
            <a class="navi-next" data-disabled="true" title="往后的相册"><i class="fa fa-chevron-right"></i></a>
        </span>
    </h1>`;

// language=HTML
const footHTML = `
    <div class="foot-bottom">
        <div class="foot-line"></div>
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
