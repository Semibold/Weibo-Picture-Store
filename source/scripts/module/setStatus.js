/**
 * Singleton
 * Set User Login Status
 */
{

    const doneCode = "100000";
    const iframeId = Utils.randomString(11);
    const url = "http://weibo.com/aj/onoff/setstatus";

    const setStatus = () => fetch(Utils.createURL(url), Utils.blendParams({
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
    }, reason => {
        return Promise.reject(Weibo.getStatus());
    });

    Weibo.setStatus = (...rift) => Utils.singleton(setStatus, ...rift);

}
