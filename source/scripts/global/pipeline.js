/**
 * Pipeline
 */
const Pipeline = new Proxy({}, {
    get(target, key, receiver) {
        switch (key) {
            case "arrayBuffer":
                return {
                    readType: "readAsArrayBuffer",
                    getBody(arrayBuffer) {
                        return arrayBuffer;
                    },
                    getParam(obj) {
                        return Object.assign({
                            s: "xml",
                            ori: "1",
                            data: "1",
                            rotate: "0",
                            wm: "",
                            app: "miniblog",
                            mime: "image/jpeg",
                        }, obj);
                    },
                };
            case "dataURL":
            default:
                return {
                    readType: "readAsDataURL",
                    getBody(base64) {
                        let name = "b64_data";
                        let formData = new FormData();
                        let [head, body] = base64.split(",");
                        formData.set(name, body);
                        return formData;
                    },
                    getParam(obj) {
                        return Object.assign({
                            s: "xml",
                            ori: "1",
                            data: "base64",
                            rotate: "0",
                            wm: "",
                            app: "miniblog",
                            mime: "image/jpeg",
                        }, obj);
                    },
                };
        }
    },
});
