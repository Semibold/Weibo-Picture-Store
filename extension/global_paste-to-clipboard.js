// ==UserScript==
// @name         Web Page 全局粘贴脚本
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  得到的图片地址自动写入到剪切板，可以粘贴使用
// @author       Aqours
// @match        *://*/*
// @grant        none
// @run-at       document_end
// ==/UserScript==
{

    self.postMessage({

        type: "WB.add_selector_listener",
        note: [
            {
                writeln: "clipboard",
                selector: "html",
                eventType: "paste",
            },
            // {
            //     writeln: "clipboard",
            //     selector: "html",
            //     eventType: "drop",
            // },
        ],
        prefix: "https://wx1.sinaimg.cn/large/",
        postfix: "",

    }, location.origin);

}
