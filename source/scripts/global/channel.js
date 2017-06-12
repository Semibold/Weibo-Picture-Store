/**
 * Channel
 */
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
        body(base64) {
            let name = "b64_data";
            let formData = new FormData();
            let [head, body] = base64.split(",");
            formData.set(name, body);
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
        mimeType(base64) {
            return Utils.parseMimeType(Utils.bufferFromBase64(base64));
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
