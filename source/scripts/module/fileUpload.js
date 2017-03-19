/**
 * File Upload
 */
{

    const sid = Utils.randomString(16);
    const notifyId = Utils.randomString(16);
    const url = "http://picupload.service.weibo.com/interface/pic_upload.php";

    Weibo.fileUpload = (result) => {
        let uid = null;
        let buffer = [];
        let total = result.length;

        for (let item of result) {
            let fileType = item.fileType;
            let oneline = Pipeline[item.readType];
            let promise = fetch(Utils.createURL(url, oneline.getParam({
                mime: fileType,
            })), Utils.blendParams({
                method: "POST",
                body: oneline.getBody(item.result),
            })).then(response => {
                return response.ok ? response.text() : Promise.reject();
            }).then(text => {
                if (text) {
                    let tree = new DOMParser().parseFromString(text, "application/xml");
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
                        let result = {sid, pid, size, width, height, fileType};
                        if (item.objectURL) {
                            result.objectURL = item.objectURL;
                        }
                        return Promise.reject(result);
                    } else {
                        return Promise.reject();
                    }
                } else {
                    return Promise.reject();
                }
            }).catch(reason => {
                let result = null;
                if (reason && reason.sid === sid) {
                    result = reason;
                } else {
                    if (item.objectURL) {
                        URL.revokeObjectURL(item.objectURL);
                    }
                }
                return Promise.resolve(result);
            });

            buffer.push(promise);
        }

        return Promise.all(buffer).then(rawData => {
            let pids = [];
            let pureData = [];
            for (let item of rawData) {
                if (item) {
                    pids.push(item.pid);
                    pureData.push(item);
                }
            }
            pids.length && Weibo.pidUpload({uid, pids});
            total && !pureData.length && Weibo.getStatus(true)
                .then(result => {
                    result.login && chrome.notifications.create(notifyId, {
                        type: "basic",
                        iconUrl: chrome.i18n.getMessage("64"),
                        title: chrome.i18n.getMessage("fail_title"),
                        message: chrome.i18n.getMessage("file_upload_failed"),
                    });
                });
            return pureData;
        });
    };

}
