/**
 * Read File
 */
{

    Weibo.readFile = (files, readType, previewURL) => {
        let buffer = [];
        let incongruent = [];
        let oneline = Channel[readType];
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
