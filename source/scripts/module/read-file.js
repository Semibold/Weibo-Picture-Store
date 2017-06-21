{

    Weibo.readFile = (files, readType = "dataURL") => {
        const buffer = [];
        const congruent = [];
        const oneline = Channel[readType];
        const blobPromise = blob => {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onloadend = e => {
                    if (e.target.readyState === e.target.DONE) {
                        resolve({
                            blob: blob,
                            readType: readType,
                            mimeType: oneline.mimeType(e.target.result),
                            result: e.target.result,
                        });
                    } else {
                        resolve();
                    }
                };
                fileReader[oneline.readType](blob);
            });
        };

        for (const blob of files) {
            if (!blob) continue;
            buffer.push(blobPromise(blob));
        }

        return Promise.all(buffer).then(list => {
            const buffer = [];
            for (const item of list) {
                if (!item) continue;
                if (Weibo.chromeSupportedType.has(item.mimeType) && !Weibo.acceptType[item.mimeType]) {
                    buffer.push(Weibo.transformSource(item.blob).catch(Utils.noop));
                } else {
                    congruent.push(item);
                }
            }
            return Promise.all(buffer);
        }).then(blobs => {
            for (const blob of blobs) {
                if (!blob) continue;
                congruent.push(blobPromise(blob));
            }
            return Promise.all(congruent);
        });
    };

}
