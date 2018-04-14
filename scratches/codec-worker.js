/* lib */
importScripts("pako.js", "UPNG.js");

self.onmessage = e => {
    const {buffers, w, h, delays} = e.data;
    console.time("Encode");
    const arrayBuffer = UPNG.encode(buffers, w, h, 0, delays);
    console.timeEnd("Encode");
    const fragment = [];
    const chunk = 512 * 1024;
    for (let i = 0; i < arrayBuffer.length; i += chunk) {
        if (i + chunk < arrayBuffer.length) {
            fragment.push(arrayBuffer.slice(i, i + chunk));
        } else {
            fragment.push(arrayBuffer.slice(i, arrayBuffer.length));
        }
    }
    e.target.postMessage({buffers: fragment, len: arrayBuffer.length});
};
