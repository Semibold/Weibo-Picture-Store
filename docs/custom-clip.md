# Custom Clip

## 自定义链接说明

| 支持的占位变量 | 描述                                                        |
| -------------- | ----------------------------------------------------------- |
| `{{pid}}`      | 图片的唯一标识。e.g: `006G4xsfgy1h8pbgtnqirj30u01hlqv5`     |
| `{{extname}}`  | 图片的扩展名或后缀名。e.g: `.jpg`, `.gif`                   |
| `{{basename}}` | 图片的基础名称。e.g: `006G4xsfgy1h8pbgtnqirj30u01hlqv5.jpg` |

### 如何使用

在弹窗的自定义输入框中输入`链接`+`占位变量`即可，占位变量最终会替换成相应的字符串。

比如：

-   `https://www.example.com/pathname/{{pid}}{{extname}}`
-   `https://www.example.com/pathname/{{basename}}`
-   `http://www.example.com/pathname/{{basename}}`
-   `//www.example.com/pathname/{{basename}}`
-   `www.example.com/pathname/{{basename}}`
-   `www.example.com/pathname/api?basename={{basename}}`

## 自定义微博剪裁

已知微博图片的自定义裁剪格式：

| 格式             | 描述                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| large            | 原始图片                                                                  |
| mw690            | 最大 690 像素宽度裁剪                                                     |
| thumbnail        | 缩略图                                                                    |
| square           | 80 像素正方形裁剪                                                         |
| thumb150         | 80 像素正方形裁剪                                                         |
| thumb180         | 180 像素正方形裁剪                                                        |
| thumb300         | 300 像素正方形裁剪                                                        |
| woriginal        | 原图，和 large 一样                                                       |
| bmiddle          | 440 像素宽度原比例缩放                                                    |
| small            | 200 像素宽度原比例缩放                                                    |
| wap50            | 50 像素宽度原比例缩放                                                     |
| wap180           | 180 像素宽度原比例缩放                                                    |
| wap240           | 240 像素宽度原比例缩放                                                    |
| wap360           | 360 像素宽度原比例缩放                                                    |
| wap720           | 720 像素宽度原比例缩放                                                    |
| wap800           | 800 像素宽度原比例缩放                                                    |
| orj180           | 不确定                                                                    |
| orj360           | 不确定                                                                    |
| crop.x.y.x1.y1.w | 自定义矩形裁剪，其中 x, y 表示左上角坐标，x1, y1 表示右下角坐标，w 是宽度 |
