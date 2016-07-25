module.exports = walker;

// Dependencies
var assert = require("assert");
var Url = require("url");
var atob = require("Base64").atob;

// Constants
var IS_DATA_URI = /^data:/;

/**
 * glTF top-level dictionary objects in a useful order in terms of dependencies
 * @type {string[]}
 */
var CATEGORIES = ["buffers", "bufferViews", "images", "videos", "samplers", "textures", "shaders", "programs",
    "techniques", "materials", "accessors", "meshes", "cameras", "lights", "skins", "nodes", "scenes", "animations"];


function walker(json, functionTable, opt) {
    assert(typeof json == 'object', "no json resource given");
    assert(functionTable, "no functionTable given");
    var currentCategory = -1;
    var referenceMap = new Map();

    opt = opt || {};
    var baseURL = opt.baseURL ? Url.parse(opt.baseURL) : null;

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
            resolveReferences(category, desc, referenceMap, baseURL);
            if (fn) {
                fn.call(opt.context, desc, id);
            }
        }
    }
}

/**
 *
 * @param {string} category The current category (e.g. "materials")
 * @param {object} desc The descriptor of the current object
 * @param {Map} map The map containing all named references that have been already resolved.
 * @param {Url} baseURL
 */
function resolveReferences(category, desc, map, baseURL) {

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

    var uri = function (obj, name) {
        var url = obj[name];
        assert(uri);
        url = Url.parse(url);
        assert(url.protocol != "data");
        if (baseURL && !url.protocol) {
            url = Url.parse(Url.resolve(baseURL, url));
        }
        obj._uri = url.href;
    };

    // Resolve IDs into references to the referenced objects
    switch (category) {
        case "buffers":
            if (IS_DATA_URI.test(desc.uri)) {
                desc._buffer = createArrayBufferFromDataURL(desc.uri);
            } else {
                // Not a data URL, so resolve the uri
                uri(desc, "uri");
            }
            break;

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

        case "images":
            // The uri of the image.
            if (IS_DATA_URI.test(desc.uri)) {
                desc._uri = desc.uri;
            } else {
                // Not a data URL, so resolve the uri
                uri(desc, "uri");
            }
            break;

        case "techniques":
            // The ID of the program.
            uri(desc, "program");
            break;

        case "shaders":
            if (IS_DATA_URI.test(desc.uri)) {
                desc._code = createStringFromDataURL(desc.uri);
            } else {
                // Not a data URL, so resolve the uri
                uri(desc, "uri");
            }
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


function createStringFromDataURL(url) {
    return atob(url.split(',')[1]);
}

function createArrayBufferFromDataURL(url) {
    var binary = atob(url.split(',')[1]);
    var buffer = new ArrayBuffer(binary.length);
    var array = new Uint8Array(buffer);
    for (var i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return buffer;
}
