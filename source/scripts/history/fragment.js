/*
 * Copyright (c) 2017 The Weibo-Picture-Store Authors. All rights reserved.
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file.
 */

import {Utils} from "../base/utils.js";

const headHTML = `
    <h1>
        <span><i class="fa fa-paragraph"></i></span>
        <span>上传记录</span>
    </h1>`;

const footHTML = `
    <div class="foot-navigator">
        <a class="prev" data-disabled="true" title="上一页"><i class="fa fa-chevron-left"></i></a>
        <a class="hint">
            <span class="pagination">- / -</span>
            <span>Ctrl+左右方向键也可以翻页</span>
        </a>
        <a class="next" data-disabled="true" title="下一页"><i class="fa fa-chevron-right"></i></a>
    </div>
    <div class="foot-bottom">
        <div class="foot-line"></div>
        <div class="foot-menu">
            <a href="https://github.com/Aqours/Weibo-Picture-Store/issues" target="_blank" title="GitHub Issues">GitHub</a>
            <a href="mailto:git@hub.moe" title="通过电子邮件反馈问题">反馈</a>
            <a href="http://git.hub.moe/donate.html" target="_blank" title="扩展很棒，捐赠以表支持 +1s">捐赠</a>
            <a href="recorder.html#changelog" target="_blank" title="简要指南及更新日志">更新日志</a>
        </div>
    </div>`;

document.getElementById("head").append(Utils.parseHTML(headHTML));
document.getElementById("foot").append(Utils.parseHTML(footHTML));
