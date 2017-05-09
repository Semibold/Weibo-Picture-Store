/**
 * File Upload
 */
{

    const failId = Utils.randomString(16);
    const url = "http://picupload.service.weibo.com/interface/pic_upload.php";

    Weibo.fileUpload = (hybrid, doneCallback, failCallback) => {
        let uid = null;
        let buffer = [];
        let fileProgress = Weibo.fileProgress(Weibo.fileProgress.TYPE_UPLOAD);
        let requestUpload = (item, replay) => {
            let oneline = Channel[item.readType];
            let promise = Utils.fetch(Utils.createURL(url, oneline.param({mime: item.file.type})), {
                method: "POST",
                body: oneline.body(item.result),
            }).then(response => {
                return response.ok ? response.text() : Promise.reject();
            }).then(text => {
                if (text) {
                    let tree = new DOMParser().parseFromString(text, "text/xml");
                    let data = tree.querySelector("root > data").textContent;
                    let pics = tree.querySelector("root > pics");
                    let pid = pics.querySelector("pic_1 > pid").textContent;
                    let size = pics.querySelector("pic_1 > size").textContent;
                    let width = pics.querySelector("pic_1 > width").textContent;
                    let height = pics.querySelector("pic_1 > height").textContent;

                    if (pid) {
                        if (!uid) {
                            try {
                                uid = JSON.parse(atob(data)).uid.toString();
                            } catch (e) {}
                        }
                        Weibo.pidUpload({pid, uid});
                        let file = item.file;
                        let objectURL = item.objectURL;
                        return {file, objectURL, pid, size, width, height};
                    } else {
                        return Promise.reject();
                    }
                } else {
                    return Promise.reject();
                }
            }).catch(reason => {
                if (!replay) {
                    return Weibo.setStatus().then(result => {
                        if (result.login) {
                            return requestUpload(item, true);
                        } else {
                            item.objectURL && URL.revokeObjectURL(item.objectURL);
                        }
                    }).catch(reason => {
                        reason.login && chrome.notifications.create(failId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("fail_title"),
                            message: chrome.i18n.getMessage("file_upload_failed"),
                        });
                        item.objectURL && URL.revokeObjectURL(item.objectURL);
                    });
                } else {
                    item.objectURL && URL.revokeObjectURL(item.objectURL);
                }
            });

            buffer.push(promise);
            return promise;
        };

        fileProgress.addNextWave(hybrid.length);
        fileProgress.triggerProgress();

        for (let item of hybrid) {
            requestUpload(item)
                .then(result => {
                    fileProgress.accumulator();
                    typeof doneCallback === "function" && doneCallback(result);
                    return Promise.resolve(result);
                })
                .catch(reason => {
                    fileProgress.accumulator();
                    typeof failCallback === "function" && failCallback(reason);
                    return Promise.reject(reason);
                });
        }

        return Promise.all(buffer).then(rawData => {
            return rawData.filter(item => {
                if (item) return item;
            });
        });
    };

}
