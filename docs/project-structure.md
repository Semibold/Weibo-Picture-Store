# Project Structure

| 目录/文件                     | 存储的文件用途描述                                           |
|---------------------------|-----------------------------------------------------|
| copyright/\*              | Copyright 描述文件，主要供 WebStorm 使用                      |
| docs/\*                   | 相关的一些文档                                             |
| scratches/\*              | 代码片段或一些有用的文件                                        |
| screenshot/\*             | 扩展示例的一些截图                                           |
| src/\*                    | 扩展的源码                                               |
| src/\_locales/\*          | I18N                                                |
| src/assets/\*             | 相关的资源文件                                             |
| src/icons/\*              | 多样的扩展图标                                             |
| src/scripts/\*            | 主要的脚本文件                                             |
| src/scripts/background/\* | Background page 的相关脚本                               |
| src/scripts/history/\*    | 上传记录页面的相关脚本                                         |
| src/scripts/inject/\*     | Web page 的相关脚本（content scripts）                     |
| src/scripts/popup/\*      | 上传弹窗的相关脚本                                           |
| src/scripts/sharre/\*     | 可以在不同 realm 中共享的脚本                                  |
| src/scripts/weibo/\*      | 微博接口相关的脚本                                           |
| src/scripts/background.ts | 入口脚本：Background page                                |
| src/scripts/env.ts        | 调试脚本：自动注入全局调试变量                                     |
| src/scripts/history.ts    | 入口脚本：上传记录页面                                         |
| src/scripts/inject.ts     | 入口脚本：Web page                                       |
| src/scripts/offscreen.ts  | 中间脚本：用于在创建的窗口中激活用户态                                 |
| src/scripts/options.ts    | 入口脚本：扩展选项页面                                         |
| src/scripts/popup.ts      | 入口脚本：上传弹窗                                           |
| src/sheets/\*\*           | CSS 文件，根据名称可以识别用途，不再详细累述                            |
| src/\*.html               | HTML 文件，根据名称可以识别用途，不再详细累述                           |
| src/manifest.json         | Chrome 扩展的清单文件                                      |
| src/manifest.firefox.json | Firefox 扩展的清单文件<br>构建 Firefox 版本时，会覆盖 manifest.json |
| \*                        | 常规的项目文件                                             |
