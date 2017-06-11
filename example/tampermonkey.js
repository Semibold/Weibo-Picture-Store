/**
 * Example for Tampermonkey
 */

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
    /**
     * 以下是最简单的用法，主要说明下参数的含义
     */

    // 在执行的时候要保证 selector 可以获取到
    // 如果 selector 是动态添加的，你需要控制代码的执行时机
    self.postMessage({

        // 固定类型
        type: "WB.add_selector_listener",

        // 要监听的事件类型
        // 目前支持：drop（拖拽）、click（点击）、paste（粘贴）
        note: [
            {
                selector: "#reply_content",
                eventType: "drop",
            },
            {
                // 结果写入到这个位置
                // 如果此值为 clipboard，则结果会写入剪切板，不写入页面中
                // 如果此值为其它值，则当作 querySelector 选择器来用
                // 如果此值不存在，则把 selector 用作 writeln
                // 目前只支持带有 value 属性的节点，比如：textarea、input
                writeln: "#reply_content",

                // 事件绑定的主体
                // querySelector 支持的选择器
                selector: ".fr span.gray",

                // 事件的类型
                eventType: "click",
            },
            {
                selector: "#reply_content",
                eventType: "paste",
            },
        ],

        // 得到的 CE_value 是图片的 pid 加后缀名，比如：006G4xsfgy1fdyyqh94oij308c06bq32.jpg
        // 得到的图片地址是：prefix + CE_value + suffix
        prefix: "https://ws1.sinaimg.cn/large/",
        suffix: "",

    }, location.origin);

}
