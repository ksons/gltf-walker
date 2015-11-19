module.exports = walker;

// Dependencies
var assert = require("assert");

/**
 * glTF top-level dictionary objects in a useful order in terms of dependencies
 * @type {string[]}
 */
var CATEGORIES = ["buffers", "bufferViews", "images", "videos", "samplers", "textures", "shaders", "programs",
    "techniques", "materials", "accessors", "meshes", "cameras", "lights", "skins", "nodes", "scenes", "animations"];


function walker(json, functionTable, ctx) {
    console.log(json);
    assert(typeof json == 'object', "no json resource given");
    assert(functionTable, "no functionTable given");
    var currentCategory = -1;
    var referenceMap = new Map();

    function next() {
        currentCategory++;
        if (currentCategory >= CATEGORIES.length) {
            return false;
        }
        if (json[CATEGORIES[currentCategory]]) {
            return true;
        }
        return next();
    }

    while (next()) {
        var category = CATEGORIES[currentCategory];
        var data = json[category];
        var fn = functionTable[category] || functionTable.default;

        //console.log(category, data);
        var keys = Object.keys(data).map(function (id) {
            referenceMap.set(id, data[id]);
            return id;
        });
        for (var i = 0; i < keys.length; i++) {
            var id = keys[i];
            var desc = data[id];
            resolveReferences(category, desc, referenceMap);
            if (fn) {
                fn.call(desc, id, ctx);
            }
        }
    }
}

/**
 *
 * @param {string} category The current category (e.g. "materials")
 * @param {object} desc The descriptor of the current object
 * @param {Map} map The map containing all named references that have been already resolved.
 */
function resolveReferences(category, desc, map) {

    var ref = function (obj, name) {
        var id = obj[name];
        assert(id);
        var resolved = map.get(id);
        assert(resolved, "could not resolve reference with id: " + id);
        resolved._id = id;
        obj[name] = resolved;
    };

    var refArray = function (arr) {
        var l = arr ? arr.length : 0;
        for (var i = 0; i < l; i++) {
            ref(arr, i);
        }
    };

    // Resolve IDs into references to the referenced objects
    switch (category) {
        case "bufferViews":
            // The ID of the buffer.
            ref(desc, "buffer");
            break;
        case "materials":
            // The ID of the technique
            ref(desc, "technique");
            for (var name in desc.values) {
                var value = desc.values[name];
                if (typeof value == "string") {
                    ref(desc.values, name);
                }
            }
            break;
        case "accessors":
            // The ID of the bufferView.
            ref(desc, "bufferView");
            break;
        case "meshes":
            // An array of primitives, each defining geometry to be rendered with a material
            for (var i = 0; i < desc.primitives.length; i++) {
                var p = desc.primitives[i];
                // A dictionary object of strings, where each string is the ID of the
                // accessor containing an attribute.
                for (var name in p.attributes) {
                    ref(p.attributes, name);
                }
                // The ID of the accessor that contains the indices
                ref(p, "indices");
                // The ID of the material to apply to this primitive when rendering
                ref(p, "material");
            }
            break;
        case "nodes":
            // TODO: camera, skeletons, skin and jointName
            // The IDs of this node's children
            refArray(desc.children);
            // The IDs of the meshes in this node
            refArray(desc.meshes);
            break;
        case "scenes":
            // The IDs of each root node.
            refArray(desc.nodes);
            break;
        case "textures":
            // The IDs of each root node.
            ref(desc, "source");
            ref(desc, "sampler");
    }
}
