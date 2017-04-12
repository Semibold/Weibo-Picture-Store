/**
 * Set User Login Status
 */
{

    const doneCode = "100000";
    const iframeId = "weibo-iframe-set-status";
    const url = "http://weibo.com/aj/onoff/setstatus";

    Weibo.setStatus = () => fetch(Utils.createURL(url), Utils.blendParams({
        method: "POST",
        body: Utils.createSearchParams({
            sid: 0,
            state: 0,
        }),
    })).then(response => {
        if (response.ok && response.redirected) {
            let iframe = document.getElementById(iframeId) || document.createElement("iframe");
            let promise = new Promise((resolve, reject) => {
                iframe.onload = e => resolve(iframe.onload = iframe.onerror = null);
                iframe.onerror = e => reject(iframe.onload = iframe.onerror = null); // Useless
            });

            iframe.id = iframeId;
            iframe.src = response.url;
            document.body.append(iframe);
            return promise;
        } else {
            return Promise.reject();
        }
    }).then(result => {
        return Promise.resolve(Weibo.getStatus());
    }).catch(reason => {
        return Promise.reject(Weibo.getStatus());
    });

}
