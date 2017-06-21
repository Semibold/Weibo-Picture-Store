const SINGLETON_MODULE = new Map();
const MULTIPLE_USER_CACHE = new Map();

const UNKNOW_BITMAP_MIME_TYPE = "";
const BITMAP_PATTERN_TABLE = [
    {
        pattern: [0x00, 0x00, 0x01, 0x00],
        mask: [0xFF, 0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/x-icon",
        note: "A Windows Icon signature.",
    },
    {
        pattern: [0x00, 0x00, 0x02, 0x00],
        mask: [0xFF, 0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/x-icon",
        note: "A Windows Cursor signature.",
    },
    {
        pattern: [0x42, 0x4D],
        mask: [0xFF, 0xFF],
        ignored: [],
        type: "image/bmp",
        note: "The string 'BM', a BMP signature.",
    },
    {
        pattern: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        mask: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/gif",
        note: "The string 'GIF87a', a GIF signature.",
    },
    {
        pattern: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
        mask: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/gif",
        note: "The string 'GIF89a', a GIF signature.",
    },
    {
        pattern: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50],
        mask: [0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/webp",
        note: "The string 'RIFF' followed by four bytes followed by the string 'WEBPVP'.",
    },
    {
        pattern: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        mask: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/png",
        note: "An error-checking byte followed by the string 'PNG' followed by CR LF SUB LF, the PNG signature.",
    },
    {
        pattern: [0xFF, 0xD8, 0xFF],
        mask: [0xFF, 0xFF, 0xFF],
        ignored: [],
        type: "image/jpeg",
        note: "The JPEG Start of Image marker followed by the indicator byte of another marker.",
    },
];
