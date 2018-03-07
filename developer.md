# Document for developer

## 101

本扩展使用 Chrome 浏览器正式支持的 API 开发，不需要任何第三方转译工具。
Node.js 是可选工具，目前主要是用来打包生成可发布的文件，你可以用自己的操作系统中的工具来完成。

目录说明：

- deploy - 最终的生成的可发布文件会在这个文件夹内
- doc - 文档目录
    - spec.vsdx - 扩展基础架构设计图
- example - 存放扩展高阶用法的示例脚本
- extension - 存放可以发布的 Tampermonkey 扩展脚本
- scratch - 存放某些功能的草稿脚本
- screenshot - 存放文档中引用的图片
- source - 扩展的源码目录
    - _locales - 多语言目录
    - assets - 存放其他资源
    - icons - 扩展用到的 icons
    - scripts - 脚本目录
        - base - 基础脚本，不依赖扩展环境
        - core - 存放和微博接口相关的实现，依赖扩展环境
        - history - 存放上传记录的相关脚本
        - popup - 存放上传弹窗的相关脚本
        - sharre - 共享模块，不依赖扩展环境
    - sheets - 样式目录
