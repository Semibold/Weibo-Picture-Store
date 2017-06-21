/**
 * Notice: `requestAnimationFrame` has no effect on chrome background page
 */
{

    const fps = 25;
    const Store = new Map();
    const nextFrame = callback => setTimeout(callback, 1000 / fps);

    const triggerProgress = (tid) => {
        let dtd = Store.get(tid);
        let avr = 3;
        let max = 0.9;
        let sec = avr * dtd.total;
        let bio = sec * fps;
        let gap = 100 / dtd.total;
        let step = gap * max / sec / fps;
        let time = 0;
        let message = "";
        let contextMessage = "";

        if (dtd.settle === dtd.total) {
            return false;
        }

        switch (tid) {
            case Weibo.fileProgress.TYPE_UPLOAD:
                message = chrome.i18n.getMessage("upload_progress_message");
                contextMessage = chrome.i18n.getMessage("upload_progress_hinter");
                break;
            case Weibo.fileProgress.TYPE_DOWNLOAD:
                message = chrome.i18n.getMessage("download_progress_message");
                contextMessage = chrome.i18n.getMessage("download_progress_hinter");
                break;
            default:
                return false;
        }

        let loop = () => {
            let next = Math.floor(dtd.settle * gap + (dtd.total - dtd.settle) * time * step);

            if (next < 10) next = 10;
            if (next > 100) next = 100;

            time >= bio ? time = bio : time++;

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
                    dtd.reformat();
                    chrome.notifications.clear(notificationId);
                }
            });

            dtd.requestId = nextFrame(loop);
        };

        dtd.requestId && clearTimeout(dtd.requestId);
        dtd.requestId = nextFrame(loop);
        return true;
    };

    const TypeEntry = class {

        constructor() {
            this.notifyId = Utils.randomString(16);
            this.requestId = null;
            this.total = 0;
            this.settle = 0;
        }

        reformat() {
            this.total = 0;
            this.settle = 0;
        }

        consume() {
            if (this.settle < this.total) {
                this.settle++;
            }
        }

        padding(n) {
            if (Number.isInteger(n) && n > 0) {
                this.total += n;
            }
        }

    };

    Weibo.fileProgress = (tid) => {
        const dtd = Store.get(tid);
        return {
            consume() {
                return dtd.consume();
            },
            padding(n) {
                return dtd.padding(n);
            },
            triggerProgress() {
                return triggerProgress(tid);
            },
        };
    };

    Store.set(Weibo.fileProgress.TYPE_UPLOAD = 1, new TypeEntry());
    Store.set(Weibo.fileProgress.TYPE_DOWNLOAD = 2, new TypeEntry());

}
