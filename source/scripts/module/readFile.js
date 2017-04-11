/**
 * Read File
 */
{

    Weibo.readFile = (files, readType, previewURL) => {
        let buffer = [];
        let oneline = Pipeline[readType];

        for (let file of files) {
            if (!file) continue;
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
        }

        return Promise.all(buffer);
    };

}
