/**
 * Read File
 */
{

    Weibo.readFile = (files, readType, previewURL) => {
         let buffer = [];
         let oneline = Pipeline[readType];

         for (let file of files) {
             if (!file) continue;
             if (Weibo.acceptType[file.type]) {
                 let fileType = file.type;
                 let promise = new Promise((resolve, reject) => {
                     let fileReader = new FileReader();
                     let startTime = null;

                     fileReader.onloadstart = e => startTime = performance.now();
                     fileReader.onloadend = e => {
                         console.log("Elapsed:", performance.now() - startTime, "ms");

                         fileReader.onloadstart = null;
                         fileReader.onloadend = null;

                         if (e.target.readyState === e.target.DONE) {
                             let result = e.target.result;
                             let data = {readType, fileType, result};
                             if (previewURL) {
                                 data.objectURL = URL.createObjectURL(file);
                             }
                             resolve(data);
                         } else {
                             resolve();
                         }
                     };
                     fileReader[oneline.readType](file);
                 });
                 buffer.push(promise);
             }
         }

         return Promise.all(buffer).then(rawData => {
             let pureData = [];
             for (let item of rawData) {
                 item && pureData.push(item);
             }
             console.log("ReadFile Ended:", pureData.length);
             return pureData;
         });
    };

}
