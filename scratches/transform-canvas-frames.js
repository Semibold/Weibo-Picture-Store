const downloadImage = (blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob) + '.png';
    a.download = new Date().toJSON();
    document.body.appendChild(a);
    a.click();
    a.remove();
};

const transformCanvasFrames = canvas => {
    const checkout = {
        animation: false,
        sampleRate: 20,
    };
    const tolerant = {
        upper: 5,
        lower: 1,
        ratio: 0.02,
    };
    const recorder = {
        tid: null,
        stime: 0,
        etime: 0,
        sindex: 0,
        eindex: 0,
        check: false,
    };
    const fragment = [];
    const primaryTimeout = 5 * 1000;
    const totalityTimeout = 60 * 1000;
    const context = canvas.getContext("2d");
    const isEqualView = (buf1, buf2) => buf1.byteLength === buf2.byteLength && buf1.every((value, index) => value === buf2[index]);
    const w = canvas.width;
    const h = canvas.height;

    recorder.stime = recorder.etime = Date.now();
    recorder.tid = setInterval(() => {
        recorder.etime = Date.now();
        if (recorder.etime - recorder.stime > totalityTimeout * 1.5) {
            clearInterval(recorder.tid);
            console.warn("Timeout: 60 * 1.5 seconds has run out. Force exit");
            return;
        }
        if (canvas.width !== w || canvas.height !== h) {
            throw new Error("Canvas width/height has changed");
        }
        try {
            const imgData = context.getImageData(0, 0, w, h);
            if (!checkout.animation && recorder.etime - recorder.stime > primaryTimeout) {
                clearInterval(recorder.tid);
                canvas.toBlob(blob => downloadImage(blob), "image/png");
                return;
            }
            if (!recorder.check && recorder.etime - recorder.stime > totalityTimeout) {
                clearInterval(recorder.tid);
                console.warn("Timeout: 60 seconds has run out");
                return;
            }

            // @see https://bugs.chromium.org/p/chromium/issues/detail?id=786381
            if (!fragment.length || !isEqualView(fragment[fragment.length - 1].imgData.data, imgData.data)) {
                fragment.push({
                    imgData: imgData,
                    timeStamp: recorder.etime,
                });
            }
            if (fragment.length >= 2) {
                checkout.animation = true;
            }
            if (fragment.length <= 2) {
                return;
            }
            const first = fragment[0];
            const latest = fragment[fragment.length - 1];
            if (isEqualView(first.imgData.data, latest.imgData.data) && !recorder.check) {
                recorder.check = true;
                recorder.sindex = fragment.length - 1;
                recorder.eindex = 2 * recorder.sindex;
            }
            if (recorder.check && fragment.length - 1 === recorder.eindex) {
                const stats = {done: 0, fail: 0};
                for (let i = 0; i < recorder.sindex; i++) {
                    if (isEqualView(fragment[i].imgData.data, fragment[i + recorder.sindex].imgData.data)) {
                        stats.done++;
                    } else {
                        stats.fail++;
                    }
                }
                const detla = Math.min(Math.max(Math.floor(recorder.sindex * tolerant.ratio), tolerant.lower), tolerant.upper);
                if (stats.fail <= detla) {
                    clearInterval(recorder.tid);
                    // const worker = new Worker("codec-worker.js");
                    // worker.onmessage = (e) => {
                    //     const {buffers, len} = e.data;
                    //     const arrayBuffer = new Uint8Array(len);
                    //     buffers.reduce((accumulator, currentValue, currentIndex, array) => {
                    //         arrayBuffer.set(currentValue, accumulator);
                    //         return accumulator + currentValue.length;
                    //     }, 0);
                    //     downloadImage(new Blob([arrayBuffer], {type: "image/png"}));
                    // };
                    console.log("frames:", fragment);
                    if (fragment.length) {
                        const buffers = [];
                        const delays = [];
                        for (let i = 0; i < fragment.length; i++) {
                            buffers.push(fragment[i].imgData.data.buffer);
                            delays.push(i === 0 ? 0 : fragment[i].timeStamp - fragment[i - 1].timeStamp);
                        }
                        // worker.postMessage({buffers, w, h, delays});
                        console.time("Encode");
                        const arrayBuffer = UPNG.encode(buffers, w, h, 0, delays);
                        console.timeEnd("Encode");
                        console.log(arrayBuffer);
                        downloadImage(new Blob([arrayBuffer], {type: "image/png"}));
                    }
                    return;
                }
                recorder.check = false;
            }
        } catch (e) {
            e.message && console.warn(e.message);
            clearInterval(recorder.tid);
        }
    }, checkout.sampleRate);
};
