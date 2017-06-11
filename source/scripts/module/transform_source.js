/**
 * Transform Source
 * Notice: `createImageBitmap` which cannot decode SVG
 */
{

    const MAX_EDGE = 2 ** 15 - 1;

    Weibo.transformSource = (blob) => {
        return createImageBitmap(blob)
            .then(bitmap => {
                let width = Math.ceil(bitmap.width);
                let height = Math.ceil(bitmap.height);

                if (width > MAX_EDGE || height > MAX_EDGE) {
                    return Promise.reject(new RangeError("Beyond the border"));
                }

                let canvas = document.createElement("canvas");
                let context = canvas.getContext("2d");

                canvas.width = width;
                canvas.height = height;
                context.drawImage(bitmap, 0, 0, width, height);
                bitmap.close();

                return new Promise((resolve, reject) => canvas.toBlob(blob => resolve(blob), "image/png"));
            }).catch(reason => {
                console.warn("Transform Source:", reason);
                return Promise.reject(reason);
            });
    };

}
