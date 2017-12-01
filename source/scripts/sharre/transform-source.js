/**
 * WARN: `createImageBitmap` which cannot decode SVG(Scalable Vector Graphics)
 */
import {MAXIMUM_EDGE} from "../base/constant.js";

export const transformSource = blob => {
    return createImageBitmap(blob)
        .then(bitmap => {
            const width = Math.ceil(bitmap.width);
            const height = Math.ceil(bitmap.height);

            if (width > MAXIMUM_EDGE || height > MAXIMUM_EDGE) {
                return Promise.reject("Beyond the border");
            }

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

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
