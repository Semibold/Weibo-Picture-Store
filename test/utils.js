/**
 * Utils
 */
QUnit.module("Utils Module", hooks => {

    QUnit.test("call checkURL method", assert => {
        assert.strictEqual(Utils.checkURL("/"), false, "/ is not url");
        assert.strictEqual(Utils.checkURL("http://example.com"), true, "good url");
        assert.strictEqual(Utils.checkURL(5), false, "5 is not url");
    });

    QUnit.skip("call fetch method");
    QUnit.skip("call singleton method");
    QUnit.skip("call createURL method");
    QUnit.skip("call createSearchParams method");
    QUnit.skip("call blendParams method");
    QUnit.skip("call parseHTML method");
    QUnit.skip("call randomString method");
    QUnit.skip("call writeToClipboard method");
    QUnit.skip("call bufferFromBase64 method");

    QUnit.test("call isPatternMatch method", assert => {
        let item = BITMAP_PATTERN_TABLE[6];
        let p = item.pattern;
        assert.strictEqual(Utils.isPatternMatch(p, item), true, "good data");
        assert.strictEqual(Utils.isPatternMatch([...p, 23], item), true, "good data");
        assert.strictEqual(Utils.isPatternMatch(p.slice(0, -1), item), false, "bad data");
        assert.strictEqual(Utils.isPatternMatch([19, ...p], item), false, "bad data");
    });

    QUnit.skip("call parseMimeType method");

});
