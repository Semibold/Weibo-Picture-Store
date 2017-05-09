/**
 * File Progress
 * Notice: `requestAnimationFrame` has no effect on chrome background page
 */
{

    const fps = 25;
    const types = new Map();
    const Store = new Map();

    const BuildStore = class {

        constructor() {
            this.total = 0;
            this.settle = 0;
            this.notifyId = Utils.randomString(16);
            this.requestId = null;
        }

        accumulator() {
            this.settle++;
        }

        addNextWave(n) {
            if (Number.isInteger(n) && n > 0) {
                this.total += n;
            }
        }

    };

    const nextFrame = callback => setTimeout(callback, 1000 / fps);

    const fileProgress = (tid) => {
        let dtd = Store.get(tid);
        let end = tid === Weibo.fileProgress.TYPE_UPLOAD;
        let avr = 3;
        let max = 0.9;
        let sec = avr * dtd.total;
        let bio = sec * fps;
        let gap = 100 / dtd.total;
        let step = gap * max / sec / fps;
        let time = 0;
        let message = "";
        let contextMessage = "";

        switch (tid) {
            case Weibo.fileProgress.TYPE_UPLOAD:
                message = chrome.i18n.getMessage("upload_progress_message");
                contextMessage = chrome.i18n.getMessage("upload_progress_hinter");
                break;
            case Weibo.fileProgress.TYPE_DOWNLOAD:
                message = chrome.i18n.getMessage("download_progress_message");
                contextMessage = chrome.i18n.getMessage("download_progress_hinter");
                break;
        }

        let loop = (timeStamp) => {
            let next = Math.floor(dtd.settle * gap + (dtd.total - dtd.settle) * time * step);

            if (next < 10) next = 10;
            if (next > 100) next = 100;
            time > bio ? time = bio : time++;

            chrome.notifications.create(dtd.notifyId, {
                type: "progress",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("info_title"),
                message: message,
                contextMessage: contextMessage,
                progress: next,
                requireInteraction: true,
            }, notificationId => {
                if (dtd.settle === dtd.total) {
                    dtd.requestId && clearTimeout(dtd.requestId);
                    chrome.notifications.clear(notificationId, wasCleared => {
                        wasCleared && end && chrome.notifications.create(dtd.notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("file_upload_ended"),
                        });
                    });
                }
            });

            dtd.requestId = nextFrame(loop);
        };

        dtd.requestId && clearTimeout(dtd.requestId);
        dtd.requestId = nextFrame(loop);
    };

    Weibo.fileProgress = (tid) => {
        let dtd = Store.get(tid);
        return {
            accumulator: () => dtd.accumulator(),
            addNextWave: (n) => dtd.addNextWave(n),
            triggerProgress: () => fileProgress(tid),
        };
    };

    types.set("TYPE_UPLOAD", 1).set("TYPE_DOWNLOAD", 2);
    types.forEach((value, key, map) => {
        Weibo.fileProgress[key] = value;
        Store.set(Weibo.fileProgress[key], new BuildStore());
    });

}
