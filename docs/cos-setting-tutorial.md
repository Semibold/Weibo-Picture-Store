# COS Setting Tutorial


## Bucket Settings

> 存储桶设置

![Bucket 权限设置](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg1i6hqryj30l50gkq32.jpg)

首先在腾讯云对象存储中创建一个 Bucket，创建的访问权限选择公有读私有写，其他按需填写。如果要使用已有 Bucket，需要把访问权限改为公有读私有写。

![微博图床扩展的选项页面](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg1s0as77j30k40eft9n.jpg)

![获取 AccessKey、SecretKey](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg1n1lsm6j30kj09c0ss.jpg)

在云对象管理中，点击密钥管理，跳转至密钥管理页面后，获取相关的 SecretId、SecretKey 填入相应的位置。

![获取 Bucket Host](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg1us1izrj30m307qjrf.jpg)

获取目标 Bucket 的访问域名，这里需要使用适用于 XML API 的域名。

![设定 Path](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg2448a7aj30gc08qq2v.jpg)

指定一个存储文件的目录，留空则表示使用根目录。目录会在上传文件的时候自动创建，因此不需要手动创建。


## Cloud Image Settings

> 万象优图设置

![关联万象优图](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg28s5qdxj30ig0acaa0.jpg)

新增方式选中绑定已有 COS Bucket，Bucket 一栏中填写上面创建的 Bucket 名称，其他信息按需选择。

![获取 Picture Host](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg2aj5em0j30jw08sq2y.jpg)

获取图片处理域名填入 Picture Host，也可以选择 CDN 加速或者自定义域名。虽然 Picture Host 是选填，但是建议填写，否则缩略图不生效，并且在历史记录页面中不能查看大图。缩略图及图片处理的规则请查看万象优图的文档。

全部填写完成后，点击更新来保存和验证当前信息。


## Matters Need Attention

> 注意事项

![CORS 注意](https://ws4.sinaimg.cn/large/006G4xsfgy1fqg2fq53vjj30l605odfp.jpg)

如果以上信息验证成功，则会在 Bucket 中设置一条类似图中的跨域访问 CORS 规则。注意不要删除这条规则，否则腾讯云图床将不能正常工作。如果误删除了这条规则，可以在扩展选项页面中点击更新来重新设置跨域访问的规则。另外，如果 Bucket 或者万象优图设置了图片防盗链，则需要注意根据黑白名单的规则，排除或添加微博图床扩展的地址。

上传文件时，不会像微相册那样进行严格的文件校验，这意味着可以上传图片以外的文件，但是最终只能得到上传结束，无法知晓文件是否上传成功，因此建议不要上传非图片文件。上传过程中产生的文件名和文件后缀是由上传的文件决定的。目前是 64MB 以下的文件（包含 64MB，这个闸值后续会根据统计数据调整），由 SHA-1 摘要算法计算得出文件的文件名，而 64MB 以上的文件，则会从文件中取样 64MB 的数据加上文件的元数据计算得出文件名。文件后缀从上传的文件中获取，其次从文件的 Content-Type 中获取，如果两者的数据都为空，则上传的文件不带文件后缀。

在获取上传记录的数据时，不能准确的判断所用的文件是否是图片类型，因此这里采用的过滤规则是根据文件后缀来判断文件是否是图片，如果不是图片文件则在上传记录中不会显示。
