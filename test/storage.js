/**
 * Storage
 * Utils.local
 */
QUnit.module("Storage: localStorage", {
    before() {
        localStorage.clear();
        localStorage.setItem("k0", JSON.stringify("value0"));
        localStorage.setItem("k1", JSON.stringify("value1"));
    },
}, hooks => {

    QUnit.skip("read length", assert => {
        assert.ok(Utils.local.length === 2, "Utils.local.length === 2");
    });

    QUnit.skip("call key method", assert => {
        assert.ok(Utils.local.key(0) === "k0", "Utils.local.key(0) === 'k0'");
        assert.ok(Utils.local.key("1") === "k1", "Utils.local.key('1') === 'k1'");
    });

    QUnit.skip("call setItem method", assert => {
        Utils.local.setItem("k2", 2);
        Utils.local.setItem("k3", true);
        assert.ok(JSON.parse(localStorage.getItem("k2")) === 2, "JSON.parse(localStorage.getItem('k2')) === 2");
        assert.ok(JSON.parse(localStorage.getItem("k3")) === true, "JSON.parse(localStorage.getItem('k3')) === true");
    });

    QUnit.skip("call getItem method", assert => {
        assert.ok(Utils.local.getItem("k2") === 2, "Utils.local.getItem('k2') === 2");
        assert.ok(Utils.local.getItem("k3") === true, "Utils.local.getItem('k3') === true");
    });

    QUnit.skip("call removeItem method", assert => {
        Utils.local.removeItem("k3");
        assert.ok(JSON.parse(localStorage.getItem("k3")) === null, "JSON.parse(localStorage.getItem('k3')) === null");
    });

    QUnit.skip("call clear method", assert => {
        Utils.local.clear();
        assert.ok(localStorage.length === 0, "localStorage.length === 0");
    });

});
