/**
 * @param {HTMLCanvasElement} canvas
 */
function checkCanvasFrames(canvas) {
    const checkout = {
        fps: null,
        animation: false,
        sampleRate: 10,
    };
    const tolerant = {
        upper: 1,
        lower: 5,
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

    recorder.stime = recorder.etime = Date.now();
    recorder.tid = setInterval(() => {
        recorder.etime = Date.now();
        if (recorder.etime - recorder.stime > totalityTimeout * 1.5) {
            clearInterval(recorder.tid);
            console.warn("Timeout: 60 * 1.5 seconds has run out. Force exit");
            return;
        }
        try {
            const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
            if (!checkout.animation && recorder.etime - recorder.stime > primaryTimeout) {
                clearInterval(recorder.tid);
                // todo: handle as .png
                return;
            }
            if (!recorder.check && recorder.etime - recorder.stime > totalityTimeout) {
                clearInterval(recorder.tid);
                console.warn("Timeout: 60 seconds has run out");
                return;
            }

            // todo: chrome bug. first arrayBuffer view comparasion result is always false.
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
                    // todo: handle as .gif
                    return;
                }
                recorder.check = false;
            }
        } catch (e) {
            clearInterval(recorder.tid);
            e.message && console.warn(e.message);
            // todo: Tainted canvases hinter
        }
    }, checkout.sampleRate);
}
