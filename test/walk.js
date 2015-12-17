var walk = require("../lib");
var assert = require('chai').assert;
var fs = require('fs');

var DATA_DIR = __dirname + '/data/';

describe("walk", function () {

    var gltf = null;

    beforeEach(function (done) {
        fs.readFile(DATA_DIR + "CesiumTexturedBoxTest.gltf", "utf-8", function (err, data) {
            if (err) done(err);
            gltf = JSON.parse(data);
            done();
        });
    });

    it("throws if arguments are missing", function () {
        assert.throws(walk, /no json/);
        assert.throws(walk.bind(null, {}), /no functionTable/);
        assert.doesNotThrow(walk.bind(null, gltf, {}))
    });

    it("triggers accessor callback", function () {
        var expected = Object.keys(gltf.accessors).length;
        var actual = 0;
        walk(gltf, {
            accessors: function () {
                actual++;
            }
        });
        assert.equal(actual, expected);
    });


    it("triggers default callback", function () {
        var actual = 0;
        walk(gltf, {
            default: function () {
                actual++;
            }
        });
        assert.equal(actual, 21);
    });

    it("triggers no animation callback, if it not exists", function () {
        walk(gltf, {
            animations: function () {
                assert.fail();
            }
        });
    });

    it("triggers material callback with expected arguments", function () {
        var actual = 0;

        walk(gltf, {
            materials: function (desc, id) {
                actual++;
                assert.equal(id, "Effect-Texture");
                assert.equal(desc.name, "Texture");
                assert.deepEqual(desc, gltf.materials["Effect-Texture"]);
            }
        });

        assert.equal(actual, 1);
    });

    it("creates ArrayBuffers from buffers with data URL", function () {
        var expected = Object.keys(gltf.buffers).length;
        var actual = 0;
        walk(gltf, {
            buffers: function (desc, id) {
                assert.instanceOf(desc._buffer, ArrayBuffer);
                actual++;
            }
        });
        assert.equal(actual, expected);
    });


    it("resolves IDs to references", function () {
        walk(gltf, {
            bufferViews: function (desc, id) {
                assert.instanceOf(desc.buffer, Object);
                assert.strictEqual(desc.buffer, gltf.buffers[desc.buffer._id]);
            },
            accessors: function(desc) {
                assert.instanceOf(desc.bufferView, Object);
                assert.strictEqual(desc.bufferView, gltf.bufferViews[desc.bufferView._id]);
            }
        });
    });

});


