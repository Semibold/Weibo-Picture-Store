/**
 * Transform Source
 * Notice: `createImageBitmap` which cannot decode SVG
 */
{

    const MAX_EDGE = 2 ** 15 - 1;

    Weibo.transformSource = (blob) => {
        let objectURL = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = e => resolve(image);
            image.onerror = e => reject(e);
            image.src = objectURL;
        }).then(image => {
            let width = Math.ceil(image.width);
            let height = Math.ceil(image.height);

            if (width > MAX_EDGE || height > MAX_EDGE) {
                return Promise.reject("Beyond the border");
            }

            let canvas = document.createElement("canvas");
            let context = canvas.getContext("2d");

            canvas.width = width;
            canvas.height = height;
            context.drawImage(image, 0, 0, width, height);

            return new Promise((resolve, reject) => canvas.toBlob(blob => resolve(blob), "image/png"));
        }).then(result => {
            URL.revokeObjectURL(objectURL);
            return Promise.resolve(result);
        }, reason => {
            console.warn("Transform Source:", reason);
            URL.revokeObjectURL(objectURL);
            return Promise.reject(reason);
        });
    };

}
