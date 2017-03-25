// ==UserScript==
// @name         添加 V2EX 回复框自动贴图的功能
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       Aqours
// @match        *://www.v2ex.com/*
// @grant        none
// @run-at       document_end
// ==/UserScript==
{

    self.postMessage({

        type: "WB.add_selector_listener",
        note: [
            {
                // writeln: "clipboard",
                selector: "#reply_content",
                eventType: "drop",
            },
            {
                writeln: "#reply_content",
                selector: ".fr span.gray",
                eventType: "click",
            },
            {
                // writeln: "clipboard",
                selector: "#reply_content",
                eventType: "paste",
            },
        ],
        prefix: "https://ws1.sinaimg.cn/large/",
        postfix: "",

    }, location.origin);

}
