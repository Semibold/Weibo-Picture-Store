const Channel = new Proxy({
    arrayBuffer: {
        readType: "readAsArrayBuffer",
        body(arrayBuffer) {
            return arrayBuffer;
        },
        param(option) {
            return Object.assign({
                s: "xml",
                ori: "1",
                data: "1",
                rotate: "0",
                wm: "",
                app: "miniblog",
                mime: "image/jpeg",
            }, option);
        },
        mimeType(arrayBuffer) {
            return Utils.parseMimeType(arrayBuffer);
        },
    },
    dataURL: {
        readType: "readAsDataURL",
        body(dataURL) {
            const formData = new FormData();
            formData.set("b64_data", dataURL.split(",")[1]);
            return formData;
        },
        param(option) {
            return Object.assign({
                s: "xml",
                ori: "1",
                data: "base64",
                rotate: "0",
                wm: "",
                app: "miniblog",
                mime: "image/jpeg",
            }, option);
        },
        mimeType(dataURL) {
            return Utils.parseMimeType(Utils.bufferFromBase64(dataURL.split(",")[1]));
        },
    },
}, {
    get(target, key, receiver) {
        switch (key) {
            case "arrayBuffer":
                return Reflect.get(target, "arrayBuffer", receiver);
            case "dataURL":
            default:
                return Reflect.get(target, "dataURL", receiver);
        }
    },
});
