{

    const doneCode = "100000";
    const iframeId = `iframe-${Utils.randomString(6)}`;
    const url = "http://weibo.com/aj/onoff/setstatus";
    const setStatusRequest = () => {
        const method = "POST";
        const body = Utils.createSearchParams({sid: 0, state: 0});
        return Weibo.getStatus().then(json => {
            // 检测 cookies 的 secure 属性是否被设置为 true
            chrome.cookies.getAll({
                domain: "weibo.com",
                secure: true,
            }, cookies => {
                if (cookies.length) {
                    console.warn("Unexcepted Error: cookies secure detected");
                }
            });
            if (json.login) {
                return Promise.reject(json);
            } else {
                return Utils.fetch(url, {method, body}).then(response => {
                    if (response.ok) {
                        if (response.redirected) {
                            const iframe = document.getElementById(iframeId) || document.createElement("iframe");
                            const promise = new Promise((resolve, reject) => {
                                iframe.onload = e => resolve();
                                iframe.onerror = e => reject(); // Useless
                            });
                            iframe.id = iframeId;
                            iframe.src = response.url;
                            document.body.append(iframe);
                            return promise;
                        } else {
                            return Promise.reject(response.redirected);
                        }
                    } else {
                        return Promise.reject(response.status);
                    }
                }).then(result => {
                    return Promise.resolve(Weibo.getStatus(true));
                }).catch(reason => {
                    return Promise.reject(Weibo.getStatus(true));
                });
            }
        });
    };

    Weibo.setStatus = () => Utils.singleton(setStatusRequest);

}
