/**
 * Read File
 */
{

    Weibo.readFile = (files, readType, previewURL) => {
        let buffer = [];
        let incongruent = [];
        let oneline = Pipeline[readType];
        let pushStack = file => {
            let promise = new Promise((resolve, reject) => {
                let fileReader = new FileReader();
                let startTime = null;

                fileReader.onloadstart = e => startTime = performance.now();
                fileReader.onloadend = e => {
                    console.log("Elapsed:", performance.now() - startTime, "ms");

                    fileReader.onloadstart = null;
                    fileReader.onloadend = null;

                    if (e.target.readyState === e.target.DONE) {
                        resolve({
                            file: {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                            },
                            readType: readType,
                            result: e.target.result,
                            objectURL: previewURL ? URL.createObjectURL(file) : null,
                        });
                    } else {
                        resolve();
                    }
                };
                fileReader[oneline.readType](file);
            });
            buffer.push(promise);
        };

        for (let file of files) {
            if (!file) continue;
            if (Weibo.chromeSupportedType.has(file.type) && !Weibo.acceptType[file.type]) {
                incongruent.push(Weibo.transformSource(file).then(blob => pushStack(blob)).catch(Utils.noop));
                continue;
            }
            pushStack(file);
        }

        return Promise.all(incongruent).then(result => Promise.all(buffer));
    };

}


/**
 * Transform Source
 * Does not split this function from this file
 */
{

    const MAX_EDGE = 2 ** 15 - 1;

    Weibo.transformSource = (blob) => {

        /**
         * Does not use `createImageBitmap` which cannot decode svg.
         */

        let objectURL = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = e => {
                image.onload = null;
                image.onerror = null;
                resolve(image);
            };
            image.onerror = e => {
                image.onload = null;
                image.onerror = null;
                reject();
            };
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

            return new Promise((resolve, reject) => {
                canvas.toBlob(blob => resolve(blob), "image/png");
            });
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
