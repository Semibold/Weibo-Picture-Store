/**
 * Read File
 */
{

    Weibo.readFile = (files, readType) => {
        let buffer = [];
        let congruent = [];
        let oneline = Channel[readType];
        let filePromise = file => {
            return new Promise((resolve, reject) => {
                let fileReader = new FileReader();
                fileReader.onloadend = e => {
                    if (e.target.readyState === e.target.DONE) {
                        resolve({
                            file: {
                                name: file.name,
                                size: file.size,
                                type: oneline.mimeType(e.target.result),
                            },
                            rawFile: file,
                            readType: readType,
                            result: e.target.result,
                        });
                    } else {
                        resolve();
                    }
                };
                fileReader[oneline.readType](file);
            });
        };

        for (let file of files) {
            if (!file) continue;
            buffer.push(filePromise(file));
        }

        return Promise.all(buffer).then(result => {
            let buffer = [];
            for (let i = 0; i < result.length; i++) {
                let item = result[i];
                if (!item) continue;
                if (Weibo.chromeSupportedType.has(item.file.type) && !Weibo.acceptType[item.file.type]) {
                    buffer.push(Weibo.transformSource(item.rawFile).catch(Utils.noop));
                } else {
                    congruent.push(item);
                }
            }
            return Promise.all(buffer);
        }).then(result => {
            for (let file of result) {
                if (!file) continue;
                congruent.push(filePromise(file));
            }
            return Promise.all(congruent);
        });
    };

}
